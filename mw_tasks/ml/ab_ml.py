import json
import os
import pandas as pd
import numpy as np
from tqdm import tqdm
from sklearn import svm
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from scipy import signal
from bisect import bisect
from sklearn.decomposition import FastICA
from random import random
from sklearn.model_selection import KFold, cross_val_score

import matplotlib.pyplot as plt 

EEG_CHANNELS = ['TP9', 'AF7', 'AF8', 'TP10']

DATADIR = '../data/ab_test'
block_files = [f for f in os.listdir(DATADIR) if os.path.isfile(os.path.join(DATADIR, f))]
blocks = [{'_eeg': [], '_ppg': [], '_telem': [], '_events': [], '_trialData': [], 'time': []} for f in block_files]
for i, blockfile in enumerate(block_files):
    block = json.load(open(os.path.join(DATADIR, blockfile)))
    for key in block.keys():
        blocks[i][key] = block[key]

dfs = []
for block in blocks:
    data = block
    EEGDATA = {key:[] for key in ['index', 'probe-0', 'probe-1', 'probe-2', 'probe-3', 
                                'timestamp', 'subject_id', 'trial_index', 'stimulus']}
    MARKERDATA = {'time':[], 'event':[], 'trial_index': []}

    minIdx = min([reading['index'] for reading in data['_eeg']])
    maxIdx = max([reading['index'] for reading in data['_eeg']])
    EEG = {key:[[] for _ in range(maxIdx-minIdx+1)] for key in ['index', 'probe-0', 'probe-1', 'probe-2', 'probe-3', 'timestamp']}
    indices = []
    for reading in data['_eeg']:
        idx = reading['index'] - minIdx
        probe = f"probe-{reading['electrode']}"
        EEG[probe][idx] = reading['samples']
        EEG['timestamp'][idx] = reading['timestamp']
        EEG['index'][idx] = reading['index']

    df = pd.DataFrame(EEG)
    # (impute nan values later)
    # unroll the eeg data so that each row is one sample
    EEGUnrolled = {key:[] for key in ['index', 'timestamp', 'probe-0', 'probe-1', 'probe-2', 'probe-3']}
    for i in range(len(EEG['index'])):
        # should be 12, but occasionally problems occur    
        num_samples = min([len(EEG[probe][i]) for probe in ['probe-0', 'probe-1', 'probe-2', 'probe-3']])
        if num_samples == 0: continue 

        for key in [x for x in EEG.keys() if x not in ['index', 'timestamp']]:
            EEGUnrolled[key].extend(EEG[key][i][:num_samples])

        EEGUnrolled['index'].extend([EEG['index'][i]]*num_samples)
        
        for j in range(num_samples):
            offset = 1.0 / 256 * 1000 * (num_samples - j)
            EEGUnrolled['timestamp'].append(EEG['timestamp'][i] - offset)
        # EEGUnrolled['timestamp'].extend([EEG['timestamp'][i]]*num_samples)

    df = pd.DataFrame(EEGUnrolled)

    # find the locations to insert the event timestamps into the EEG data.
    event_locs = []
    curr_time_idx = 0
    for i, event in enumerate(data['_events']):
        event_locs.append(bisect(df['timestamp'], event['timestamp']))

    # bisect provides the location to insert into the list; we're rounding up here. 
    # the event time is approximately 2ms off of the eeg timestamp; the difference should be negligable. 
    event_data = ['none' for _ in range(len(df['timestamp']))]
    event_timestamps = [0 for _ in range(len(df['timestamp']))]
    for event_loc, event in zip(event_locs, data['_events']):
        event_data[event_loc] =  event['value']
        event_timestamps[event_loc] = event['timestamp']

    df['event'] = event_data

    df = df.drop(columns=['index', 'timestamp'])
    dfs.append(df)

df = pd.concat(dfs, ignore_index=True)

# filter noise from raw data with notch and bandpass filters
for i in range(4):
    HZ_TO_FILTER = 60
    QUALITY_FACTOR = 30
    SAMPLING_RATE = 256

    # notch filter
    b, a = signal.iirnotch(HZ_TO_FILTER, QUALITY_FACTOR, SAMPLING_RATE)
    df['probe-{}'.format(i)] = signal.filtfilt(b, a, df['probe-{}'.format(i)])

    # bandpass filter 
    # https://nigelrogasch.gitbook.io/tesa-user-manual/filter_data/butterworth_filter
    b, a = signal.butter(4, [0.1, 30], 'bandpass', fs=SAMPLING_RATE)
    df['probe-{}'.format(i)] = signal.filtfilt(b, a, df['probe-{}'.format(i)])


# re-ref to the average of the mastoids
# https://www.fieldtriptoolbox.org/faq/why_should_i_use_an_average_reference_for_eeg_source_reconstruction/
AVG_REF = (df['probe-0'] + df['probe-3']) / 2
df['probe-1'] = df['probe-1'] - AVG_REF
df['probe-2'] = df['probe-2'] - AVG_REF
df = df.drop(columns = ['probe-0', 'probe-3'])

# ICA filter to remove eye blinks, etc. 
# Hyvärinen, A., & Oja, E. (2000). Independent component analysis: algorithms and applications. Neural networks, 13(4-5), 411-430.
# Hyvärinen, A. (1999). Fast and robust fixed-point algorithms for independent component analysis. IEEE Transactions on Neural Networks, 10(3),626-634
ica = FastICA(n_components=2)
components = ica.fit_transform(df[['probe-1', 'probe-2']].values)
A = ica.mixing_ 
filtered_chans = np.dot(components, A.T)
df['probe-1'] = filtered_chans[:,0]
df['probe-2'] = filtered_chans[:,1]


# NOTE: assumes 'start' is always before 'end'...which *should* be the case. 
trials = {'A':[], 'B':[]}
event_lookup = {'assets/A.png_trial_ended': 'A', 'assets/B.png_trial_ended': 'B'}
tnum = 0
for i, event in enumerate(df['event']):
    if 'fixation_start' in event:
        start_idx = i
    elif 'end' in event and 'fixation' not in event:
        end_idx = i+1
        trial = df[start_idx:end_idx].copy().reset_index(drop=True)

        # baseline correction
        trial['probe-1'] = trial['probe-1'] - trial.loc[0:30, 'probe-1'].mean()
        trial['probe-2'] = trial['probe-2'] - trial.loc[0:30, 'probe-2'].mean()


        # https://www.frontiersin.org/articles/10.3389/fnins.2017.00109/full
        # Finally, all segments were submitted to an artifact rejection algorithm that marked and
        #  removed segments that had gradients of greater than 10 μV/ms and/or a 100 μV absolute within 
        # segment difference.
        if min(trial['probe-1']) < -100 or min(trial['probe-2']) < -100 or \
            max(trial['probe-1']) > 100 or max(trial['probe-2']) > 100:
            continue

        p1_grad = np.gradient(trial['probe-1'])
        p2_grad = np.gradient(trial['probe-2'])

        # continue if any gradients are greater than 10uv
        if max(p1_grad) > 10 or max(p2_grad) > 10 or \
            min(p1_grad) < -10 or min(p2_grad) < -10:
            continue

        # round down a bit. 
        trials[event_lookup[event]].append(trial.loc[0:290, :])
        tnum += 1

# print(trials['A'])
# drop event column
for trial_type in trials:
    trials[trial_type] = [trial.drop(columns=['event']) for trial in trials[trial_type]]

X = trials['A'] + trials['B']
X = [x.T for x in X]
for i, x in enumerate(X):
    x.loc['probe-1', list(range(291, 291+291))] = list(x.loc['probe-2', :])
    x = x.loc['probe-1', :]
    X[i] = x

Y = [0 for _ in range(len(trials['A']))] + [1 for _ in range(len(trials['B']))]

k_folds = KFold(n_splits=10, shuffle=True)
for model in [RandomForestClassifier(), svm.SVC()]:
    print(model) 
    scores = cross_val_score(model, X, Y, cv=k_folds, scoring='accuracy')
    print(f"cv accuracy scores: {scores}")
    print(f"average: {np.mean(scores)}")
#rand_order = {key: sorted(list(range(len(trials[key]))), key=lambda k: random()) for key in ['A', 'B']}

# trainX = {key: [trials[key][i] for i in rand_order[key][:int(.8*len(trials[key]))] ] for key in ['A', 'B']}
# trainY = [0 for _ in range(len(trainX['A']))] + [1 for _ in range(len(trainX['B']))]
# trainX = trainX['A'] +  trainX['B']
# TRAINIDX = sorted(list(range(len(trainX))), key=lambda k: random())
# TRAINX = [trainX[i] for i in TRAINIDX]
# TRAINX = [X.T for X in TRAINX]
# # turn the 'probe2' row into a series of extra columns
# # convert data to time series of both channels as one row
# for i, X in enumerate(TRAINX):
#     X.loc['probe-1', list(range(291, 291+291))] = list(X.loc['probe-2', :])
#     X = X.loc['probe-1', :]
#     TRAINX[i] = X
# TRAINY = [trainY[i] for i in TRAINIDX]


# testX = {key: [trials[key][i] for i in rand_order[key][int(.8*len(trials[key])):] ] for key in ['A', 'B']} 
# testY = [0 for _ in range(len(testX['A']))] + [1 for _ in range(len(testX['B']))]
# testX = testX['A'] + testX['B']
# TESTIDX = sorted(list(range(len(testX))), key=lambda k: random())
# TESTX = [testX[i] for i in TESTIDX]
# TESTX = [X.T for X in TESTX]
# for i, X in enumerate(TESTX):
#     X.loc['probe-1', list(range(291, 291+291))] = list(X.loc['probe-2', :])
#     X = X.loc['probe-1',:]
#     TESTX[i] = X
# TESTY = [testY[i] for i in TESTIDX]


# # train the model
# for model in [RandomForestClassifier(), LogisticRegression(max_iter=1000), svm.SVC()]:
#     model.fit(TRAINX, TRAINY)
#     print(model.score(TESTX, TESTY))
# clf = svm.SVC()
# clf.fit(TRAINX, TRAINY)
# y_pred = clf.predict(TESTX)
# print("SVM")
# print(classification_report(TESTY, y_pred))



# ERP 
# AF7_A = []
# AF7_B = []
# AF8_A = []
# AF8_B = []
# for i in range(30+256):
#     AF7_A.append(np.mean([trial['probe-1'].iloc[i] for trial in trials['A']]))
#     AF7_B.append(np.mean([trial['probe-1'].iloc[i] for trial in trials['B']]))

#     AF8_A.append(np.mean([trial['probe-2'].iloc[i] for trial in trials['A']]))
#     AF8_B.append(np.mean([trial['probe-2'].iloc[i] for trial in trials['B']]))


# plt.plot(AF7_A, label='AF7 A')
# plt.plot(AF7_B, label='AF7 B')
# plt.axvline(x=30, color='black')
# plt.legend()
# plt.show()

# plt.plot(AF8_A, label='AF8 A')
# plt.plot(AF8_B, label='AF8 B')
# plt.axvline(x=30, color='black')
# plt.legend()
# plt.show()
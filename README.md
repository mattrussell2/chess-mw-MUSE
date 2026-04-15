# chess-mw-MUSE
## A set of experimental tasks developed in JSPsych which leverage MuseJS for low-cost EEG data collection. 

Code implements the experimental paradigm outlined https://arxiv.org/abs/2505.07592. 

If you use this code in research, please cite the following:

```
@misc{russell2025neuralsignatureschesspuzzle,
      title={Neural Signatures Within and Between Chess Puzzle Solving and Standard Cognitive Tasks for Brain-Computer Interfaces: A Low-Cost Electroencephalography Study}, 
      author={Matthew Russell and Samuel Youkeles and William Xia and Kenny Zheng and Aman Shah and Robert J. K. Jacob},
      year={2025},
      eprint={2505.07592},
      archivePrefix={arXiv},
      primaryClass={cs.HC},
      url={https://arxiv.org/abs/2505.07592}, 
}
```

Note that rotation images in the `mw_tasks\assets` folder are reproduced from the following work:
```
@article{ganis2015new,
  author    = {Ganis, Giorgio and Kievit, Rogier},
  title     = {A New Set of Three-Dimensional Shapes for Investigating Mental Rotation Processes: Validation Data and Stimulus Set},
  journal   = {Journal of Open Psychology Data},
  year      = {2015},
  volume    = {3},
  number    = {1},
  pages     = {e3},
  doi       = {10.5334/jopd.ai}
}
```

The chessboard logic in `chess_task` is from 
```
@misc{chessboardjs,
  author       = {Dees, Chris},
  title        = {chessboard.js},
  howpublished = {\url{https://chessboardjs.com}},
  year         = {2019},
  note         = {Version 1.0.0}
}
```
The javascript framework used in the creation of the tasks is:
```
@article{deleeuw2015jspsych,
  author    = {de Leeuw, Joshua R.},
  title     = {jsPsych: A {JavaScript} library for creating behavioral experiments in a {Web} browser},
  journal   = {Behavior Research Methods},
  year      = {2015},
  volume    = {47},
  number    = {1},
  pages     = {1--12},
  doi       = {10.3758/s13428-014-0458-y}
}
```

And the tool used to extract neural data is 
```
@misc{musejs,
  author       = {Urish, Uri},
  title        = {muse-js: {Muse} {EEG} Headset {JavaScript} Library},
  howpublished = {\url{https://github.com/urish/muse-js}},
  year         = {2017},
  note         = {Accessed: 2026-04-15}
}
```

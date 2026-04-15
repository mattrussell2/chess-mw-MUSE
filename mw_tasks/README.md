# MW_TASKS
A set of mental workload tasks (stroop, nback, and mental rotation) to be run with the MUSE 2 device. Leverages JSPsych and musejs. 

To run the tasks themselves you will need a MUSE 2 device. 

```{bash}
npm install .
./run_servers.sh
# edit src/taskinfo.js as needed for each task
```

Rotation images reproduced from the following study:
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

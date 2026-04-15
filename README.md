[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.19599254.svg)](https://doi.org/10.5281/zenodo.19599254)

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

The chessboard logic in `chess_task` and chess piece images are from 
```
@misc{chessboardjs,
  author       = {Oakman, Chris},
  title        = {chessboard.js: A {JavaScript} chessboard},
  howpublished = {\url{https://www.npmjs.com/package/chessboardjs}},
  year         = {2023},
  note         = {Version 1.0.0}
}
```

The chess game implementation logic is from 
```
@misc{chessjs,
  author       = {Schmich, Jeff},
  title        = {chess.js: A {JavaScript} chess library},
  howpublished = {\url{https://www.npmjs.com/package/chess.js}},
  year         = {2023},
  note         = {Version 1.0.0}
}
```

The javascript framework used in the creation of the tasks is:
```
@article{deleeuw2023jspsych,
  author    = {de Leeuw, Joshua R. and Gilbert, Rebecca A. and Luchterhandt, Bj\"{o}rn},
  title     = {{jsPsych}: Enabling an open-source collaborative ecosystem of behavioral experiments},
  journal   = {Journal of Open Source Software},
  year      = {2023},
  volume    = {8},
  number    = {85},
  pages     = {5351},
  doi       = {10.21105/joss.05351}
}
```

The chess puzzle database is extracted from
```
@misc{lichess2024,
  author       = {{Lichess Team}},
  title        = {Lichess Database},
  howpublished = {\url{https://database.lichess.org/}},
  year         = {2023},
  note         = {Accessed: January 2023}
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

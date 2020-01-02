## ccBooleanAnalysis: Boolean-based representations of Biological Systems
ccBooleanAnalysis is an open-source modeling system that can visualize biological networks as logic gate circuits, and vice-versa.

### Why ccBooleanAnalysis?
In recent years, discrete dynamic modeling has emerged as a powerful method of modeling and understanding biological systems. One type, boolean network models (which was initially used as a prototypical model of genetic regulatory networks), has been shown to be a tractable approach for modeling large-systems. A boolean network consists of a set of nodes whose state is binary and is determined only by other nodes in the network through Boolean functions. The simplicity and self-containment of these graphs makes it extremely fast to simulate these systems and is also a very realistic interpretation of how biological networks actually work. Unfortunately, no computer systems currently exist for converting a visualization of a biological network into a logic gate visualization and vice-versa.

### Preparing to developing (install build tools)
run:

    npm install .

### Custom Build
If you want to build the just once, run this script in the ccBooleanAnalysis project directory:

    gulp scripts

### Run file watcher
While if you want to run file watcher that recompile library after every change to source file, run this:

    gulp

The ccBooleanAnalysis build files will be in the build/ directory.

### Usage
#### Client-side

    <script src="/PATH/TO/ccBooleanAnalysis.min.js" type="text/javascript"></script>
    ...
    var equal = ccBooleanAnalysis.compare("X","Y");

#### Node.JS
First, run `npm install ccBooleanAnalysis`. Then, in your source file:

    var ccBooleanAnalysis = require('ccBooleanAnalysis');
    ...
    var equal = ccBooleanAnalysis.compare("X","Y");

### License
ccBooleanAnalysis is under the ___ license. See LICENSE file.

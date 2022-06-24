
let Mic = require('node-microphone');

module.exports = function (RED) {
    function MicRmsNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        let mic = new Mic({ endian: 'little', bitwidth: 16, encoding: 'signed-integer', rate: 16000 });
        let micStream = mic.startRecording();

        let SlowResult = 0.0;
        let FastResult = 0.0;
        let firstRun = true;
        micStream.on('data', (data) => {
            const buffArray = new Int16Array(data.buffer);
            let sumSquares = 0.0;

            
            for (const amplitude of buffArray) { sumSquares += amplitude * amplitude; }
            FastResult = Math.sqrt(sumSquares / buffArray.length);
            if (firstRun) {
                firstRun = false
                SlowResult = FastResult;
            } else {
                SlowResult = FastResult * 0.05 + SlowResult * 0.95;
            }

        });

        setInterval(() => {
            node.send([{ payload: FastResult }, { payload: SlowResult }])
        }, 500);


        mic.on('info', (info) => {
            var msg = { payload: info }
            node.warn(msg);
        });
        mic.on('error', (error) => {
            node.warn(error);
        });

        this.on('close', function () {
            mic.stopRecording();
        });

    }
    RED.nodes.registerType("mic-rms", MicRmsNode);
}

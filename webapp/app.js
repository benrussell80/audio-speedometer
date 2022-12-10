class Recorder {
    constructor(fftSize = 2048) {
        this.fftSize = fftSize
    }

    async setup() {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.recorder = new MediaRecorder(this.stream);
        this.audioContext = new AudioContext();
        this.source = this.audioContext.createMediaStreamSource(this.stream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = this.fftSize;
        this.buffer = new Float32Array(this.analyser.frequencyBinCount);
        this.source.connect(this.analyser);
    }

    start() {
        this.recorder.start();
    }

    /**
     * @param {number} n Indicates the number of highest frequencies to keep. If false-y then all will be returned. More or fewer may be returned depending on data.
     * @returns {Object<number, number>}
     */
    getData() {
        this.analyser.getFloatFrequencyData(this.buffer);
        let freqBinWidth = this.audioContext.sampleRate / 2 / (this.buffer.length - 1);
        return this.buffer.reduce((agg, cur, index) => {
            agg[index * freqBinWidth] = cur + 140;
            return agg
        }, {})
    }

    stop() {
        this.recorder.stop();
    }
}

/**
 * @param {any} content 
 * @param {string} fileName 
 * @param {string} contentType 
 */
function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

function main() {
    document.querySelector('button#start').addEventListener('click', () => {
        let recorder = new Recorder(8192);
        recorder.setup()
            .then(() => {
                recorder.start();
                let data = []
                let interval = setInterval(() => {
                    data.push(recorder.getData());
                    if (data.length >= 6 * 60) {
                        clearInterval(interval);
                        recorder.stop();
                        let dataStr = JSON.stringify(data, null, 2);
                        download(dataStr, 'recording.json', 'application/json');
                    }
                }, 1000 / 60)
            });
    })
}
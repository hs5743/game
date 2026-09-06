from pathlib import Path
import wave

# Rewrite extended Windows WAV headers as canonical PCM before Godot import.
for path in sorted((Path(__file__).resolve().parents[1] / "audio").glob("*.wav")):
    with wave.open(str(path), "rb") as source:
        params = source.getparams()
        frames = source.readframes(params.nframes)
        assert len(frames) == params.nframes * params.nchannels * params.sampwidth, path
    with wave.open(str(path), "wb") as target:
        target.setparams(params)
        target.writeframes(frames)
    print("PCM verified:", path.name, params.nframes)

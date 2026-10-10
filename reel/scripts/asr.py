import sherpa_onnx, numpy as np, wave, json, sys
D="models/"+sys.argv[1]+"/"
kind=sys.argv[2]
if kind=="giga":
    rec=sherpa_onnx.OfflineRecognizer.from_transducer(encoder=D+"encoder.int8.onnx",decoder=D+"decoder.onnx",joiner=D+"joiner.onnx",tokens=D+"tokens.txt",model_type="nemo_transducer",num_threads=4)
else:
    rec=sherpa_onnx.OfflineRecognizer.from_transducer(encoder=D+"encoder.int8.onnx",decoder=D+"decoder.int8.onnx",joiner=D+"joiner.int8.onnx",tokens=D+"tokens.txt",num_threads=4)
w=wave.open("audio.wav"); a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
cfg=sherpa_onnx.VadModelConfig(); cfg.silero_vad.model="models/silero_vad.onnx"; cfg.silero_vad.min_silence_duration=0.25; cfg.silero_vad.max_speech_duration=12; cfg.sample_rate=16000
vad=sherpa_onnx.VoiceActivityDetector(cfg,buffer_size_in_seconds=120)
segs=[]
for i in range(0,len(a),512):
    vad.accept_waveform(a[i:i+512])
    while not vad.empty():
        segs.append((vad.front.start,np.array(vad.front.samples))); vad.pop()
vad.flush()
while not vad.empty():
    segs.append((vad.front.start,np.array(vad.front.samples))); vad.pop()
out=[]
for st,s in segs:
    pad=np.zeros(int(0.3*16000),dtype=np.float32)
    x=np.concatenate([pad,s,pad])
    stream=rec.create_stream(); stream.accept_waveform(16000,x); rec.decode_stream(stream)
    r=stream.result; off=st/16000-0.3
    out.append({"start":st/16000,"end":(st+len(s))/16000,"text":r.text,"tokens":list(r.tokens),"ts":[t+off for t in r.timestamps]})
    print(f"[{st/16000:6.2f}-{(st+len(s))/16000:6.2f}] {r.text}")
json.dump(out,open(sys.argv[3],"w"),ensure_ascii=False)

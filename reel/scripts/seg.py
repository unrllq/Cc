import cv2, numpy as np, subprocess, mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision
V="/root/.claude/uploads/52c36dc1-8e89-5753-8257-49250abfdf30/ad6c55d0-telegram_video.mp4"
opt=vision.ImageSegmenterOptions(base_options=mpp.BaseOptions(model_asset_path="models/selfie_mc.tflite"),running_mode=vision.RunningMode.VIDEO,output_confidence_masks=True)
seg=vision.ImageSegmenter.create_from_options(opt)
cap=cv2.VideoCapture(V); W,H=464,848
p=subprocess.Popen(["ffmpeg","-y","-v","error","-f","rawvideo","-pix_fmt","gray","-s",f"{W}x{H}","-r","30","-i","-","-c:v","ffv1","mask.mkv"],stdin=subprocess.PIPE)
i=0; prev=None
while True:
    ok,f=cap.read()
    if not ok: break
    img=mp.Image(image_format=mp.ImageFormat.SRGB,data=cv2.cvtColor(f,cv2.COLOR_BGR2RGB))
    r=seg.segment_for_video(img,int(i*1000/30))
    bg=r.confidence_masks[0].numpy_view()
    m=1.0-bg
    m=cv2.resize(m,(W,H))
    if prev is not None: m=0.6*m+0.4*prev
    prev=m
    p.stdin.write((np.clip(m,0,1)*255).astype(np.uint8).tobytes()); i+=1
p.stdin.close(); p.wait(); print(i)

import cv2, numpy as np, json, mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision
V="/root/.claude/uploads/52c36dc1-8e89-5753-8257-49250abfdf30/ad6c55d0-telegram_video.mp4"
det=vision.FaceDetector.create_from_options(vision.FaceDetectorOptions(base_options=mpp.BaseOptions(model_asset_path="models/face.tflite"),running_mode=vision.RunningMode.VIDEO))
cap=cv2.VideoCapture(V); out=[]; i=0
while True:
    ok,f=cap.read()
    if not ok: break
    r=det.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB,data=cv2.cvtColor(f,cv2.COLOR_BGR2RGB)),int(i*1000/30))
    if r.detections:
        b=r.detections[0].bounding_box; out.append([b.origin_x+b.width/2,b.origin_y+b.height/2,b.width])
    else: out.append(None)
    i+=1
json.dump(out,open("face.json","w")); print(i,sum(o is None for o in out)); print(out[::300])

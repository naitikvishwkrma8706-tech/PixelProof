
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
from pathlib import Path
import sys
import json

device = torch.device("cpu")

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "resnet18_tigas.pth"

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


def predict_image(image_path):

    if not MODEL_PATH.exists():
        raise FileNotFoundError("ResNet18 model not found!")

    checkpoint = torch.load(
        MODEL_PATH,
        map_location=device,
        weights_only=True
    )

    model = models.resnet18(weights=None)
    model.fc = nn.Linear(model.fc.in_features, 2)

    model.load_state_dict(checkpoint["model_state_dict"])
    model = model.to(device)
    model.eval()

    image_path = Path(image_path)

    if not image_path.exists():
        raise FileNotFoundError("Image not found!")

    image = Image.open(image_path).convert("RGB")
    image_tensor = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(image_tensor)
        probabilities = torch.softmax(outputs, dim=1)[0]
        predicted_index = torch.argmax(probabilities).item()

    idx_to_class = {
        0: "REAL",
        1: "FAKE"
    }

    predicted_class = idx_to_class[predicted_index]
    confidence = probabilities[predicted_index].item() * 100

    result = {
        "prediction": predicted_class,
        "confidence": round(confidence, 2),
        "probabilities": {
            "REAL": round(probabilities[0].item() * 100, 2),
            "FAKE": round(probabilities[1].item() * 100, 2)
        }
    }

    print(json.dumps(result))


if __name__ == "__main__":

    if len(sys.argv) != 2:
        print(json.dumps({
            "error": "Please provide an image path."
        }))
        sys.exit(1)

    try:
        predict_image(sys.argv[1])

    except Exception as error:
        print(json.dumps({
            "error": str(error)
        }))
        sys.exit(1)

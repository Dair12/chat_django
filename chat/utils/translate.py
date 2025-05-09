import os
from google.cloud import translate_v2 as translate
from dotenv import load_dotenv

# Загружаем переменные из .env
load_dotenv()

# Получаем путь из переменной окружения
credential_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

# Устанавливаем путь в системную переменную
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = os.path.abspath(credential_path)

# Создаем клиента
translate_client = translate.Client()

def translate_message(text, target_language='en'):
    result = translate_client.translate(text, target_language=target_language)
    return result['translatedText']
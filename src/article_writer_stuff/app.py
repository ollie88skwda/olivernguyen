import openai
import markdown
import os
from call_paapi import search_items
import time
from PIL import Image, ImageOps
import numpy as np
import cv2
import requests
from io import BytesIO
import imgbbpy
import matplotlib.pyplot as plt
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# use setx to set api var
openai.api_key = os.getenv("OPENAI_API_KEY")

def convert_list_to_string(LIST):
  string = ""
  for i in LIST:
    string+=i
    string+='\n'
  return string
    
def process_image(image_url, image_number, background_size=(1200,680), background_color=(246,246,246)):
  response = requests.get(image_url)
  if response.status_code == 200:
    product_img = Image.open(BytesIO(response.content)).convert("RGBA")
    product_img.save("peepee.png")
  else:
    raise Exception(f"Failed to download image from URL: {image_url}. Check internet")
  
  # determine size
  image = Image.open("peepee.png")
  width, height = image.size
  
  # resize to size of background
  # adjust width
  heightCentering = 0
  widthCentering = 0
  if width/(1200/680) > height:
    newWidth = 1100
    newHeight = round(1100/width*height)
    widthCentering = 1
  else:
    newWidth = round(600/height*width)
    newHeight = 600
    heightCentering = 1
  image.resize((newWidth, newHeight))
  
  product_img = ImageOps.fit(product_img, (newWidth, newHeight), centering=(0.5,0.5))
  background = Image.new("RGBA", background_size, background_color)
  
  # convert to array???????
  product_array = np.array(product_img)
  
  # mask for background removal?
  lower_bound = np.array([0, 0, 0, 0], dtype=np.uint8)
  upper_bound = np.array([246, 246, 246, 255], dtype=np.uint8)
  mask = cv2.inRange(product_array, lower_bound, upper_bound)
  
  plt.imshow(mask, cmap='gray')
  # plt.show()
  
  product_array[mask == 0] = [246, 246, 246, 255]
  
  product_img = Image.fromarray(product_array)
  background.paste(product_img, 
                   (50*widthCentering+(round((1200-newWidth)/2)*heightCentering), 25*heightCentering+(round((680-newHeight)/2)*widthCentering)), 
                    product_img)
  
  background.save("images/processed_image" + str(image_number) + ".png")
  
  # convert to link
  client = imgbbpy.SyncClient('b6182f447f20a321b32514ea06e7ec05')
  image = client.upload(file="images/processed_image" + str(image_number) + ".png",expiration=60000)
  
  return(image.url)
    
def gen_products(PRODUCT):
  stream = openai.chat.completions.create(
      model="gpt-4o-mini",
      messages=[{"role": "user", "content": f"Give me a list of the 10 best {PRODUCT} sold on Amazon. Separate each product with a new line. Only give me the name of the product."}],
      stream=True,
  )
  products = []
  current_chunk = ""
  for chunk in stream:
    if chunk.choices[0].delta.content is not None:
        current_chunk+=(chunk.choices[0].delta.content)
    if "\n" in current_chunk:
      products.append(current_chunk.strip())
      current_chunk = ""
  return products

def gen_article(PRODUCTS, LINKS, PRODUCT, IMAGES):
  PRODUCTS = convert_list_to_string(PRODUCTS)
  LINKS = convert_list_to_string(LINKS)
  IMAGES = convert_list_to_string(IMAGES)
  
  prompt = f"""Please write me a Medium.com article about {PRODUCT}.
        I would like you use this list of products: {PRODUCTS}.
        Here are the corresponding links for those products: {LINKS}.
        Here are some images that you can put under the titles of each products: {IMAGES}
        Please make the product titles hyperlinks using the products and links."""
  with open("prompt.txt", "r", encoding="utf-8") as f:
    txt = f.read()
    prompt = prompt + txt
    f.close()
  print(prompt)
  stream = openai.chat.completions.create(
      model="gpt-4o-mini",
      messages=[{"role": "user", "content": prompt}],
      stream=True,
  )
  
  with open("article.txt", "w") as a:
    for chunk in stream:
      if chunk.choices[0].delta.content is not None:
        a.write(chunk.choices[0].delta.content)
  a.close()

def gen_tags(PRODUCT):
  stream = openai.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content":f"Generate me 8 Medium.com article tags that I can use to classify this product: {PRODUCT}"}],
    stream=True
  )
  for chunk in stream:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end='')
      

@app.post("/generate-article")
async def generate_article(request: Request):
  # define product
  data = await request.json()
  product = data['product']
  
  products = gen_products(product)

  # generate information for article
  attributes = []
  links = []
  images = []
  for i in range(len(products)):
    attributes.append(search_items(products[i], 0))
    if attributes[i] is not None:
      links.append(attributes[i][0][0])
      images.append(process_image(attributes[i][0][1], i))
      
    time.sleep(1)
  
  # create article
  gen_article(products, links, product, images)
  
  # make it so you can copy and paste to a readable format
  with open('article.txt', 'r') as f:
    text = f.read()
    html_content = markdown.markdown(text)
    
  return {"html_content": html_content}
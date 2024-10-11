from paapi5_python_sdk.api.default_api import DefaultApi
from paapi5_python_sdk.models.partner_type import PartnerType
from paapi5_python_sdk.rest import ApiException
from paapi5_python_sdk.models.search_items_request import SearchItemsRequest
from paapi5_python_sdk.models.search_items_resource import SearchItemsResource
import os

AMAZON_ACCESS_KEY = 'AKIAIOPYIYLT77SJLQDQ'
# use setx to set api var
AMAZON_SECRET_KEY = os.getenv("AMAZON_SECRET_KEY")
ASSOCIATE_TAG = 'betterasian08-20'

def search_items(KEYWORDS, SEARCH_INDEX):
    host = "webservices.amazon.com"
    region = "us-east-1"
    
    default_api = DefaultApi(
        access_key=AMAZON_ACCESS_KEY, secret_key=AMAZON_SECRET_KEY, host=host, region=region
    )

    keywords = KEYWORDS
    search_index = "All"
    if SEARCH_INDEX != 0:
        search_index = SEARCH_INDEX
        
    item_count = 1

    search_items_resource = [
        SearchItemsResource.ITEMINFO_TITLE,
        SearchItemsResource.OFFERS_LISTINGS_PRICE,
        SearchItemsResource.IMAGES_PRIMARY_LARGE,
    ]

    try:
        search_items_request = SearchItemsRequest(
            partner_tag=ASSOCIATE_TAG,
            partner_type=PartnerType.ASSOCIATES,
            keywords=keywords,
            search_index=search_index,
            item_count=item_count,
            resources=search_items_resource
        )

    except ValueError as exception:
        print(f"Error in forming SearchItemsRequest: {exception}")
        return None

    try:
        response = default_api.search_items(search_items_request)

        if response.errors is not None:
            print("Errors in the API response:")
            for error in response.errors:
                print(f"Error code: {error.code}, message: {error.message}")
            return None

        items_list = []
        
        if response.search_result and response.search_result.items:
            for item in response.search_result.items:
                product = []
                # aff link
                if item.detail_page_url:
                    product.append(item.detail_page_url)
                    
                # image
                if item.images.primary.large:
                    product.append(item.images.primary.large.url)
                
                items_list.append(product)
                
        return items_list

    except ApiException as exception:
        print(f"Error calling PA-API 5.0! Status code: {exception.status}, Errors: {exception.body}")
        return None

    except Exception as exception:
        print(f"Exception: {exception}")
        return None
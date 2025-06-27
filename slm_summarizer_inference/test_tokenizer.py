from transformers import AutoTokenizer
import os
print('Testing tokenizer loading...')
print('Token available:', bool(os.getenv('HUGGINGFACE_HUB_TOKEN')))
try:
    tokenizer = AutoTokenizer.from_pretrained('skt/kogpt2-base-v2', token=os.getenv('HUGGINGFACE_HUB_TOKEN'))
    print('SUCCESS: Tokenizer loaded!')
    print('Vocab size:', tokenizer.vocab_size)
except Exception as e:
    print('ERROR:', e)
    import traceback
    traceback.print_exc()

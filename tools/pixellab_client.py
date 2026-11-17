"""Small PixelLab v2 client for the skeleton-driven motion trials. Stdlib only.

The API token is read from the PIXELLAB_API_KEY environment variable and is never written anywhere.
Every request and response is saved (images as PNG files, the token excluded) under the trial folder so a
result can be traced back to exactly what was sent.
"""
import base64, json, os, time, urllib.request, urllib.error

BASE = 'https://api.pixellab.ai/v2'

def _token():
    token = os.environ.get('PIXELLAB_API_KEY')
    if not token: raise SystemExit('Set PIXELLAB_API_KEY first.')
    return token

def call(method, path, body=None, timeout=120):
    data = json.dumps(body).encode('utf-8') if body is not None else None
    request = urllib.request.Request(BASE + path, data=data, method=method,
                                     headers={'Authorization': 'Bearer ' + _token(), 'Content-Type': 'application/json', 'User-Agent': 'motion-trial'})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as error:
        raise SystemExit('PixelLab %s %s -> HTTP %s: %s' % (method, path, error.code, error.read().decode('utf-8', 'replace')[:1500]))

def image(path):
    with open(path, 'rb') as f:
        return {'type': 'base64', 'base64': base64.b64encode(f.read()).decode('ascii'), 'format': 'png'}

def balance():
    return call('GET', '/balance')

def wait(job_id, every=8, limit=900):
    started = time.time()
    while True:
        job = call('GET', '/background-jobs/' + job_id)
        if job.get('status') in ('completed', 'failed'): return job
        if time.time() - started > limit: raise SystemExit('Job %s still %s after %ss' % (job_id, job.get('status'), limit))
        time.sleep(every)

def strip_images(value):
    """A copy of a request/response with base64 payloads replaced by their length, for the trial log."""
    if isinstance(value, dict):
        if value.get('type') == 'base64' and 'base64' in value: return {'type': 'base64', 'bytes': len(value['base64']) * 3 // 4}
        return {k: strip_images(v) for k, v in value.items()}
    if isinstance(value, list): return [strip_images(v) for v in value]
    return value

def save_images(images, folder, prefix):
    os.makedirs(folder, exist_ok=True); paths = []
    for index, item in enumerate(images):
        data = item['base64'] if isinstance(item, dict) else item
        if data.startswith('data:'): data = data.split(',', 1)[1]
        path = os.path.join(folder, '%s%02d.png' % (prefix, index))
        with open(path, 'wb') as f: f.write(base64.b64decode(data))
        paths.append(path)
    return paths

def log(folder, name, payload):
    os.makedirs(folder, exist_ok=True)
    with open(os.path.join(folder, name), 'w', encoding='utf-8', newline='\n') as f:
        json.dump(strip_images(payload), f, ensure_ascii=False, indent=1); f.write('\n')

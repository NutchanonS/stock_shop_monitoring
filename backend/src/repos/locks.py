import os, time
from contextlib import contextmanager

@contextmanager
def file_lock(lock_path: str, timeout_sec: int = 10):
    start = time.time()
    while True:
        try:
            fd = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.close(fd)
            break
        except FileExistsError:
            if time.time() - start > timeout_sec:
                raise TimeoutError(f"Could not acquire lock: {lock_path}")
            time.sleep(0.1)
    try:
        yield
    finally:
        try:
            os.remove(lock_path)
        except FileNotFoundError:
            pass

import sys
import traceback

with open("test_out.txt", "w", encoding="utf-8") as f:
    f.write(f"Python version: {sys.version}\n")
    try:
        import graphify
        f.write("graphify imported successfully!\n")
    except Exception as e:
        f.write(f"Error importing graphify:\n{traceback.format_exc()}\n")

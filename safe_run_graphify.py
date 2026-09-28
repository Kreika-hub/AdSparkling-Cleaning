import sys
import traceback

log_file = "run_graphify.log"

with open(log_file, "w", encoding="utf-8") as log:
    log.write(f"Python executable: {sys.executable}\n")
    log.write(f"Python version: {sys.version}\n\n")
    
    try:
        import run_graphify
        log.write("Imported run_graphify successfully.\n")
        log.write("Executing run_graphify.main()...\n")
        run_graphify.main()
        log.write("\nSUCCESS: run_graphify finished successfully!\n")
    except Exception as e:
        log.write("\nEXCEPTION OCCURRED:\n")
        log.write(traceback.format_exc())

sys.exit(0)

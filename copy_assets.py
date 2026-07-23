import os

print("Testing write in ROOT directory...")
try:
    with open("test_write_root.txt", "w") as f:
        f.write("test root")
    print("Write in ROOT succeeded!")
except Exception as e:
    print("Write in ROOT failed:", e)

print("Testing write in ASSETS using absolute path...")
abs_path = os.path.abspath(os.path.join("assets", "test_write_abs.txt"))
print("Target absolute path:", abs_path)
try:
    with open(abs_path, "w") as f:
        f.write("test abs")
    print("Write in ASSETS absolute succeeded!")
except Exception as e:
    print("Write in ASSETS absolute failed:", e)

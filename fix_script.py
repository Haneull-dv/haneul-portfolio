#!/usr/bin/env python3
import subprocess
import tempfile
import os

def fix_predictor():
    """Fix the predictor.py file in the summarizer container"""
    
    print("🔧 Starting predictor.py fix...")
    
    # Step 1: Copy file from container to local temp
    with tempfile.NamedTemporaryFile(mode='w+', suffix='.py', delete=False) as temp_file:
        temp_path = temp_file.name
    
    try:
        # Copy from container
        print("📥 Copying predictor.py from container...")
        result = subprocess.run([
            'docker', 'cp', 
            'summarizer:/app/utils/predictor.py', 
            temp_path
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"❌ Failed to copy from container: {result.stderr}")
            return False
        
        # Read and fix content
        print("🔧 Fixing environment variable quotes...")
        with open(temp_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Fix the issue
        original_content = content
        content = content.replace('getenv(HUGGINGFACE_HUB_TOKEN)', 'getenv("HUGGINGFACE_HUB_TOKEN")')
        
        if content == original_content:
            print("⚠️ No changes needed or pattern not found")
            return False
        
        # Write fixed content
        with open(temp_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # Copy back to container
        print("📤 Copying fixed file back to container...")
        result = subprocess.run([
            'docker', 'cp', 
            temp_path, 
            'summarizer:/app/utils/predictor.py'
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"❌ Failed to copy back to container: {result.stderr}")
            return False
        
        print("✅ Successfully fixed predictor.py!")
        return True
        
    finally:
        # Cleanup
        if os.path.exists(temp_path):
            os.unlink(temp_path)

def restart_container():
    """Restart the summarizer container"""
    print("🔄 Restarting summarizer container...")
    result = subprocess.run(['docker', 'restart', 'summarizer'], capture_output=True, text=True)
    if result.returncode == 0:
        print("✅ Container restarted successfully!")
        return True
    else:
        print(f"❌ Failed to restart container: {result.stderr}")
        return False

if __name__ == "__main__":
    if fix_predictor():
        restart_container()
        print("\n🎉 Fix complete! You can now test with: python test_docker_services.py")
    else:
        print("\n❌ Fix failed. Manual intervention may be required.") 
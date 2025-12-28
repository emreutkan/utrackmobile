const { withMainActivity } = require('@expo/config-plugins');
const fs = require('fs');

const withImmersiveMode = (config) => {
  return withMainActivity(config, (config) => {
    const mainActivityPath = config.modResults.path;
    
    if (fs.existsSync(mainActivityPath)) {
      let mainActivityContent = fs.readFileSync(mainActivityPath, 'utf8');
      
      // Check if immersive mode code already exists
      if (!mainActivityContent.includes('SYSTEM_UI_FLAG_IMMERSIVE_STICKY')) {
        // Add imports if not present
        if (!mainActivityContent.includes('import android.view.View;')) {
          const importRegex = /(import\s+[\w.]+;)/g;
          const imports = mainActivityContent.match(importRegex);
          if (imports && imports.length > 0) {
            const lastImport = imports[imports.length - 1];
            const lastImportIndex = mainActivityContent.lastIndexOf(lastImport);
            const insertIndex = mainActivityContent.indexOf('\n', lastImportIndex) + 1;
            mainActivityContent = 
              mainActivityContent.slice(0, insertIndex) +
              'import android.view.View;\n' +
              'import android.view.WindowManager;\n' +
              mainActivityContent.slice(insertIndex);
          }
        }
        
        // Add immersive mode code in onCreate
        const onCreateRegex = /(@Override\s+protected\s+void\s+onCreate\([^)]*\)\s*\{[^}]*super\.onCreate\([^)]*\);)/s;
        if (onCreateRegex.test(mainActivityContent)) {
          mainActivityContent = mainActivityContent.replace(
            onCreateRegex,
            `$1
        // Hide navigation bar
        View decorView = getWindow().getDecorView();
        int uiOptions = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                      | View.SYSTEM_UI_FLAG_FULLSCREEN
                      | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
        decorView.setSystemUiVisibility(uiOptions);
        
        // Keep navigation bar hidden
        decorView.setOnSystemUiVisibilityChangeListener(visibility -> {
            if ((visibility & View.SYSTEM_UI_FLAG_FULLSCREEN) == 0) {
                decorView.setSystemUiVisibility(uiOptions);
            }
        });`
          );
        }
        
        fs.writeFileSync(mainActivityPath, mainActivityContent);
      }
    }
    
    return config;
  });
};

module.exports = withImmersiveMode;

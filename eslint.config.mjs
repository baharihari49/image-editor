import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Base configuration from Next.js
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  
  // Add global rule overrides here
  {
    rules: {
      // Disable the React hooks exhaustive-deps rule globally
      'react-hooks/exhaustive-deps': 'off',
      
      // Disable unused vars warning
      '@typescript-eslint/no-unused-vars': 'off',
      
      // Other rules you might want to disable
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
    // Apply these rules to all files
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
  },
  
  // Specifically for the SimpleImageEditor component
  {
    files: ['**/SimpleImageEditor.tsx'],
    rules: {
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  
  // Specifically for the ImageEditor component
  {
    files: ['**/ImageEditor.tsx'],
    rules: {
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  
  // Specifically for the ImagePreview component
  {
    files: ['**/ImagePreview.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];

export default eslintConfig;
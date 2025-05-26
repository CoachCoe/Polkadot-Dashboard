#!/bin/bash

# Add 'use client' directive to components that use React hooks
for file in $(find src/components -name "*.tsx" -o -name "*.ts"); do
  if grep -l "useState\|useEffect\|useRef\|useCallback\|useContext\|useReducer" "$file" > /dev/null; then
    if ! grep -q "^'use client';" "$file"; then
      echo "Adding 'use client' to $file"
      sed -i '' '1i\
'"'use client';"'\
' "$file"
    fi
  fi
done

# Add 'use client' directive to hooks
for file in $(find src/hooks -name "*.tsx" -o -name "*.ts"); do
  if ! grep -q "^'use client';" "$file"; then
    echo "Adding 'use client' to $file"
    sed -i '' '1i\
'"'use client';"'\
' "$file"
  fi
done 
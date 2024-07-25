#!/bin/bash
set -e

if [[ -z "$2" ]]; then
    echo "<new service> argument is missing. Usage: $0 [mongol|psql] <new service>"
    exit 1
fi

old_string=$1
new_string=$2

SRC_DIR=$WORKSPACE_ROOT/templates/$old_string
DEST_DIR=$WORKSPACE_ROOT/templates/temp

if [[ ! -d "$SRC_DIR" ]]; then
    echo "Directory '$SRC_DIR' does not exist."
    exit 1
fi

# 템플릿 폴더 복사
rm -rf "$DEST_DIR"
cp -r "$SRC_DIR" "$DEST_DIR"

# 폴더명 변경
find "$DEST_DIR" -type d -name "*$old_string*" | while read dir; do
    new_dir=$(echo "$dir" | sed "s/$old_string/$new_string/g")
    mv "$dir" "$new_dir"
    echo "Directory renamed: $dir -> $new_dir"
done

# 파일명 변경
find "$DEST_DIR" -type f -name "*$old_string*" | while read file; do
    new_file=$(echo "$file" | sed "s/$old_string/$new_string/g")
    mv "$file" "$new_file"
    echo "File renamed: $file -> $new_file"
done

# 대상 폴더에서 모든 파일 탐색
find "$DEST_DIR" -type f | while read file; do
    # 파일 내용에서 문자열 변경
    sed -i "s/$old_string/$new_string/g" "$file"

    old_string_capitalized="$(tr '[:lower:]' '[:upper:]' <<<${old_string:0:1})${old_string:1}"
    new_string_capitalized="$(tr '[:lower:]' '[:upper:]' <<<${new_string:0:1})${new_string:1}"
    sed -i "s/$old_string_capitalized/$new_string_capitalized/g" "$file"

done

APP_DIR=$WORKSPACE_ROOT/src/app
cp -r $DEST_DIR/* "$APP_DIR"
rm -rf $DEST_DIR/

echo "export * from './${new_string}s.controller'" >>"$APP_DIR/controllers/index.ts"
echo "export * from './$new_string-exists.guard'" >>"$APP_DIR/controllers/guards/index.ts"
echo "export * from './$new_string-email-not-exists.guard'" >>"$APP_DIR/controllers/guards/index.ts"

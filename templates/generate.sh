#!/bin/bash

# 사용자로부터 원본 문자열과 새 문자열 입력받기
# echo "변경할 원본 문자열을 입력하세요:"
old_string="mongol"

echo "새 문자열을 입력하세요:"
read new_string

# 첫 글자를 대문자로 변경한 문자열 생성
old_string_capitalized="$(tr '[:lower:]' '[:upper:]' <<< ${old_string:0:1})${old_string:1}"
new_string_capitalized="$(tr '[:lower:]' '[:upper:]' <<< ${new_string:0:1})${new_string:1}"

SRC_DIR=$WORKSPACE_ROOT/templates/$old_string
DEST_DIR=$WORKSPACE_ROOT/templates/temp

# 템플릿 폴더 복사
rm -rf "$DEST_DIR"
cp -r "$SRC_DIR" "$DEST_DIR"

directory=$DEST_DIR

# 폴더명 변경
find "$directory" -type d -name "*$old_string*" | while read dir; do
    new_dir=$(echo "$dir" | sed "s/$old_string/$new_string/g")
    mv "$dir" "$new_dir"
    echo "Directory renamed: $dir -> $new_dir"
done

# 파일명 변경
find "$directory" -type f -name "*$old_string*" | while read file; do
    # 파일 내용에서 문자열 변경
    sed -i "s/$old_string/$new_string/g" "$file"
    sed -i "s/$old_string_capitalized/$new_string_capitalized/g" "$file"

    new_file=$(echo "$file" | sed "s/$old_string/$new_string/g")
    mv "$file" "$new_file"
    echo "File renamed: $file -> $new_file"
done


mv  "$DEST_DIR" "$WORKSPACE_ROOT/src"

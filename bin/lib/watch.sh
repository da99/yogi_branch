
# === {{CMD}}
# === {{CMD}} "cmd with args"
watch () {
  # for FILE in $(git ls-files --cached --others --exclude-standard | grep --extended-regexp '.js|.html|bin'); do
  #   [[ -f "$FILE" ]] && bash_setup is_same_file "$FILE" || :
  # done
  echo "" > "$TEMP/CHANGE"

  cmd="$@"
  run_cmd () {
    $cmd && echo -e "=== ${Green}$cmd${Color_Off}" || echo -e "=== ${Red}Failed${Color_Off}"
  }

  $0 server start

  if [[ -z "$cmd" ]]; then
    $0 test || :
  else
    run_cmd
  fi

  echo -e "\n=== Watching:"

  while read -r CHANGE; do
    dir=$(echo "$CHANGE" | cut -d' ' -f 1)
    path="${dir}$(echo "$CHANGE" | cut -d' ' -f 3)"
    file="$(basename $path)"
    echo "" > "$TEMP/CHANGE"

    # Make sure this is not a temp/swap file:
    { [[ ! -f "$path" ]] && continue; } || :

    # Check if file has changed:
    if bash_setup is_same_file "$path"; then
      echo "=== No change: $CHANGE"
      continue
    fi # === Has file changed?

    # File has changed:
    echo -e "\n=== $CHANGE ($path)"

    if [[ "$path" == bin/* ]]; then
      echo "=== Reloading..."
      break
    fi

    echo "$path" > "$TEMP/CHANGE"

    if [[ "$path" == www/*.js ]]; then
      js_setup jshint "$path" || continue
      if $0 server is_running; then
        $0 server start
      fi
    fi

    if [[ "$path" =~ "www/" ]]; then
      { gui_setup reload-browser google-chrome "Dum"; } || :
      continue
    fi

    if [[ -z "$cmd" ]]; then
      $0 test "$path" || :
    else
      run_cmd
    fi
  done < <(inotifywait --quiet --monitor --event close_write package.json -r www/ lib/ bin/) || exit 1

  $0 server stop
  $0 "$THE_ARGS"

} # === end function


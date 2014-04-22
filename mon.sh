#sudo apt-get install inotify-tools
eval "(node $1) &"; while inotifywait -e close_write .; do kill $!; echo "STARTING $1"; eval "(node $1) &" 2>&1; done

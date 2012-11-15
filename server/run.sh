#!/bin/sh
echo $1 $2
sh ./nativeproject.sh $1 $2
if [ $? -ne 0 ]; then
    echo "Could not build the app"
    exit 1;
fi
PLATFORM=$2

TARGET_DIR=./assembly/$PLATFORM
$TARGET_DIR/cordova/debug
if [ $? -ne 0 ]; then
    echo "Could not compile the app"
    exit 1;
fi

$TARGET_DIR/cordova/emulate
if [ $? -ne 0 ]; then
    echo "Could not run the app in the emulator"
    exit 1;
fi

read -p "Wait until the app has started and then press enter to watch the logs."

$TARGET_DIR/cordova/log

#!/bin/sh
if [ $# -ne 2 ]; then
   echo "Usage $0 <phonegap-install-dir> <platform>"
   exit 2
fi
PHONEGAP_DIR=$1
PLATFORM=$2

ASSEMBLY_DIR=./assembly
mkdir $ASSEMBLY_DIR
TARGET_DIR=$ASSEMBLY_DIR/$PLATFORM
rm -fr $TARGET_DIR

CREATE_PROJECT=$PHONEGAP_DIR/lib/$PLATFORM/bin/create
if [ ! -f $CREATE_PROJECT ]; then 
	echo Could not find the phonegap project create command. Please check the input parameters.
	exit 1;
fi

$CREATE_PROJECT $TARGET_DIR de.phonegapproxy.app phonegapproxy
if [ $? -ne 0 ]; then
    echo "Could not create the phonegap project"
    exit 1;
fi

WWW_DIR=`find $TARGET_DIR -name "www"`
if [ -z "$WWW_DIR" ]; then 
	echo Could not find the "www" directory in the project created by phonegap in $TARGET_DIR
	exit 1;
fi

TEMP_CORDOVA_JS=./cordova.js.tmp
mv $WWW_DIR/cordova*.js $TEMP_CORDOVA_JS
rm -fr $WWW_DIR/*
cp -r src/ $WWW_DIR
mv $TEMP_CORDOVA_JS $WWW_DIR/cordova.js

cp -r config/$PLATFORM/ $TARGET_DIR




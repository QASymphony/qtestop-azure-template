# qTest OnPremise Azure Template

## Given
All qTest applications and its dependency components (PostgreSQL, ElasticSearch) are pre-installed on a Linux server with a pre-configured public IP address and Server URL.
These configurations are stored in qtest.config file

## When
The server is turned into an Image, the configuration in qtest.config file is also persisted in the image, along with the OS and all other application configurartions

### And
The Image is used to spin up a new Virtual Machine (or server instance)

### And
The VM is allocated with a new public ip address

## Then
The application is inaccessible due to the IP address in qtest.config file is different with the actual public IP address of the VM

## Solution
Update application' URLs with the VM's public IP address in qtest.config file and in the database to ensure the user can access to qTest and all other applications the first time they spin up the VM from this image.

## How
Try to obtain the public IP address of the VM by either executing the command ```dig +short myip.opendns.com @resolver1.opendns.com``` (Linux) or sending request to outside web services (Windows), e.g. http://httpbin.org, https://www.ipify.org/. When succesful, update qtest.config file with the new public IP address and the application URLs in qTest database

## Notes
Portalble NodeJS is used as the run time for this application. Using portable NodeJS eliminates the need to install NodeJS into the OS. This is also to avoid potential collision with other qTest applications being built with deferent version of NodeJS (Launch, Sessions, Parameters, Pulse).

This application will be injected in qtestctl (bash-) script located in qtestctl directory. This script runs on system start up to start all qTest applications.

This applicatio performs its job one time only when the VM is first up and running just to make sure the user can access to qTest the first time with everything properly pre-configured. Later on, the user might choose to use domain URL instead of public (or even private IP address) and so no need to perform IP Address look up and update later on.

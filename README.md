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

## Solution:
Update the public IP address of the VM in qtest.config file in the first time the VM is up and running
## How:
Try to obtain the public IP address of the VM by sending request to outside web services, e.g. http://httpbin.org, https://www.ipify.org/. When succesful, update qtest.config file with the new public IP address and the application URLs in qTest database
## Notes
Portalble NodeJS is used as the run time for this application. Using portable NodeJS eliminates the need to install NodeJS into the OS
This is to avoid potential collision with other qTest applications being built on NodeJS (Launch, Sessions, Parameters, Pulse)
This application will be injected in qtestctl script, which runs on system start up to start all qTest application. 
However, it performs its job one time only in the first time the VM is up and running, just to avoid updating the IP address that the user interntionally put into the application

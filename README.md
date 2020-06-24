# qTest OnPremise Azure Bootstrapper

## Given
All qTest applications and its dependency components (PostgreSQL, ElasticSearch) are pre-installed on a Linux server with a pre-configured public IP address and Server URL.
These configurations are stored in *qtest.config* file

## When
The server is turned into an Image, the configuration in *qtest.config* file is also persisted in the image, along with the OS, the application configurartions and the database itself

### And
The Image is used to spin up a new Virtual Machine (or server instance)

### And
The VM is allocated with a different public ip address

## Then
The qTest application is inaccessible due to the IP address in qtest.config file is different with the actual public IP address of the VM

## Solution
Build a lightweight application naming **qtest-azure-bootstapper** to update qTest applications' URLs (plural) with the VM's public IP address in qtest.config file and in the database to ensure the user can access to qTest and all other applications the first time they spin up the VM from this image.

## How
During qTest application start up, the *qtestctl* (bash-) script (located at qtest installation directory) is executed by the system via command `./qtestctl start`, we will inject **qtest-azure-bootstapper** for it to obtain the public IP address of the VM (technically, via executing the command ```dig +short myip.opendns.com @resolver1.opendns.com``` (on Linux), or sending HTTP request to outside web services (on Windows), e.g. http://httpbin.org, https://www.ipify.org/). When succesful, **qtest-azure-bootstapper** update the application URLs in *qtest.config* file and in qTest database.

## Notes
Portalble NodeJS is used as the run time for this application. Using portable NodeJS eliminates the need to install NodeJS into the OS. This is also to avoid potential collision with other qTest applications being built with different version of NodeJS (Launch, Sessions, Parameters, Pulse).

This application performs its job when it detects the VM's public IP address is different with the one being used for applications' URLs in *qtest.config* file (and in database too) at the time the VM is up and running just to ensure the user can access to qTest in the first time with everything properly pre-configured.

## How To Integrate This Code to qtestctl during Azure Image building process

### Pre-requitesite
Azure Linux VM built with CentOS image version 7.x
All qTest applicatons have been installed and configured properly, including configuring applications' URLs in qTest Configuration page and verified they are accessible.

### Steps
Assuming qTest is installed in the VM at /home/qtestctl/ directory

SSH to Azure VM

Execute this command to switch root user
```$ sudo su```

Navigate to /home/ directory
```$ cd /home```

Download this application from this repo to /home/ directory
```$ wget https://github.com/QASymphony/qtestop-azure-template/raw/master/releases/qtest-azure-bootstraper-1.0.zip```

Create a folder for this application
```$ mkdir /home/qtest-azure-bootstrapper-1.0```

Unzip the applcation to the newly created directory
```$ unzip /home/qtest-azure-bootstraper-1.0 qtest-azure-bootstraper-1.0.zip```

Open `/home/qtest-azure-bootstraper-1.0/app.config.json` in a text editor, e.g. nano
```$nano /home/qtest-azure-bootstraper-1.0/app.config.json```

Change the value of the field `ip_address_to_be_replaced` to the actual Public IP Address of the VM (you can always find this in Azure Portal)

Change the value `env.name` to `prod`.

If you're not installing qTest in `/home/qtestctl`, change the value of `env.prod.qtest_config_file_path` to reflect the full path to `qtest.config` file.

Save.

Open the `qtestctl` file (without extension) located at qtest installation folder in a text editor, e.g. nano
```$nano /home/qtestctl/qtestctl```

Scroll to the bottom to locate this line `if [ "$APP_START" = true ] ; then`, then add this line right after it, like below:
```/home/qtest-azure-bootstraper-1.0/nodejs/bin/node /home/qtest-azure-bootstraper-1.0/app.js```

The file will look like below

![Injetct qtest-azure-bootstraper to qtestctl script](/qtest-azure-bootstrapper/docs/injection.png)

As you can guess, that line will execute the nodejs application naming `app.js` located at `/home/qtest-azure-bootstraper-1.0/app.js`

Save and Close the editor.

Last step is to install qTest as a service on the VM so qtestctl script will get executed in every server startup.
```[/home/qtestctl]$ ./install```

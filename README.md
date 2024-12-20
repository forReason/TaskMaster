# Welcome To TaskMaster
Taskmaster is the simplest implementation for a simple eisenhower matrix. It does not get simpler than that
![image](https://github.com/user-attachments/assets/72b63bef-ae42-4c45-a62c-116f11133e37)

# Usage
The usage can currently be a little finnicky at times, especially in the beginning. once you created a few tasks it will be a breeze

## Create a new Task
To create a new Task, click on the bluw plus sign in the center
![image](https://github.com/user-attachments/assets/09fb49c6-3cef-4144-a6c4-a93ae7251c63)

You will then see a task pop up:
![image](https://github.com/user-attachments/assets/35f41adc-ddfc-4fe7-9e2a-cb4188ef41ac)

Click on the edit button to the right.
The Text selection is a little finnicky. I reccomend clicking 3 times fast on either the title or description to mark all text and start typing:
![image](https://github.com/user-attachments/assets/230b00a0-83dc-40b0-b8cc-9e3f9fc7c9d5)

Finally, Instead of saving, I recommend dragging and dropping your task into the right priority container right away:
![image](https://github.com/user-attachments/assets/e743b8f2-0cb4-4cee-b718-26cd37bf80ac)

end result:
![image](https://github.com/user-attachments/assets/86d1b9da-aa89-421e-a9a3-a965693fb8c0)



# Installation
Requirements:
- .Net 8.0 needs to be installed
- a webserver ( e.g. ) nginx needs to be available

recommended process:
The process has been testes with an ubuntu server:

1. I placed the application files in my ~/software folder. this can be any location, but you need to adjust your service path.
```
user@drg-taskmaster:~/software$ ls -la
total 4688
drwxrwxr-x 16 user user    4096 Dec 16 19:42 .
drwxr-x---  7 user user    4096 Dec 16 19:29 ..
[...]
-rwxrwxr-x  1 user user   72520 Dec 16 19:40 TaskMaster
-rw-rw-r--  1 user user   17235 Dec 16 19:21 TaskMaster.deps.json
-rw-rw-r--  1 user user   55296 Dec 16 19:40 TaskMaster.dll
[...]
```

2. set the exe file to executable
```
chmod +x /path/to/TaskMaster.exe
```

3. Test if the server is running
```
cd /path/to/TaskMaster.Exe
./TaskMaster.exe
```

4. Allow Firewall rules
```
sudo ufw allow 5000/tcp
sudo ufw allow 'Nginx Full'
```

5. Create service file for autostart of TaskMaster Server
`sudo nano /etc/systemd/system/taskmaster.service`
```
[Unit]
Description=TaskMaster Service
After=network.target

[Service]
User=youruser
Group=youruser
WorkingDirectory=/home/youruser/software
ExecStart=/home/youruser/software/TaskMaster
Restart=always
RestartSec=5
Environment=ASPNETCORE_ENVIRONMENT=Production

[Install]
WantedBy=multi-user.target
```
-> NOTE: Check the path and user/group. these should be just your username. You can find your username using `whoami`

6. Place the client files under your nginx http folder. Per default, this should be /var/www/html
   You will need to adjust your server address in `FrontEnd/scripts/services/taskService.js`

8. Reboot server

9. try to access your server from the webbrowser. Nginx should load the taskmaster wepage for you and it should connect to the server

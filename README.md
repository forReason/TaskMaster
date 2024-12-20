# Welcome To TaskMaster
Taskmaster is the simplest possible implementation for an eisenhower task matrix. It does not get simpler than that:  
![image](https://github.com/user-attachments/assets/72b63bef-ae42-4c45-a62c-116f11133e37)

You will create very simplistic task items. 
A title and a short description. Special characters may not be fully supported in descriptions, newlines are not supported in descriptions yet.

The application is programmed to gently nudge you into the right direction with small, but effective mind tricks.
The colors are chosen in a way that you prioritize meaningful tasks and refrain from the unimportant stuff. At the same time, your active task pulsates, shines and sparkles. Gently drawing your attention towards it.
Have fun and relax with the simplicity of this applicaiton. There is almost nothing to learn about its usage. Simply start and get productive.

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

## Managing tasks
Managing your tasks is super simple. Just drag and drop tasks to the right priority containers.
Edit them by hitting the edit button. 
Mark the task you want to work on as active in the edit menu. This will highlight it and draw your attention to it with gentle psychological tricks.
when you are done with a task delete it. An archive is still outstanding. Remember: This application is simple.

## Note for usage on the phone
TaskMaster relies heavily on drag and drop actions. On the phone, you need to tap and hold a task item for a couple of seconds, to become drag and droppable.

## Backing up your tasks
Your tasks are stored as text files on the server, in the server application directory. This is something to work on still, but remember. Its all about simplicity. Get productive. Dont get hung up in details and endless possibilities. Just. Keep. It. Simple, Dumbass.

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

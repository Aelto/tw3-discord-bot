service_name := "tw3discordbot"
service_path := "/etc/containers/systemd/" + service_name
ssh_target := "rpi"

deploy-container: && reload-production-services
  @ echo 1: setting up target directories and service files
  @ ssh {{ssh_target}} "sudo mkdir -p {{service_path}} && sudo touch {{service_path}}/listeners-database.json"

  @ echo 2: deploy files to the home directory
  @ scp quadlet/{{service_name}}.container {{ssh_target}}:~/{{service_name}}.container
  @ scp quadlet/{{service_name}}-image.tar {{ssh_target}}:~/{{service_name}}-image.tar

  @ echo 3: move deployed files to production directory
  ssh {{ssh_target}} "sudo mv {{service_name}}.container {{service_name}}-image.tar {{service_path}}/"

reload-production-services:
  @ echo reloading systemd, restarting {{service_name}}
  @ ssh {{ssh_target}} "sudo systemctl daemon-reload; sudo systemctl restart {{service_name}}"

"connectionString": "HostName=Arimaa-IoT-Hub.azure-devices.net;SharedAccessKeyName=service;SharedAccessKey=E5mpGHtp5qlZIsbSBG7d4YTvBuryf2Kya0VSbhuODoY="

pham [ ~ ]$ az iot hub consumer-group create --hub-name Arimaa-IoT-Hub --name My-Farm
{
"etag": null,
"id": "/subscriptions/4a50809b-15ae-40d5-9a6a-a870ffcce588/resourceGroups/ITSS_Nh%C3%BAng/providers/Microsoft.Devices/IotHubs/Arimaa-IoT-Hub/eventHubEndpoints/events/ConsumerGroups/My-Farm",
"name": "My-Farm",
"properties": {
"created": "Sat, 08 Jul 2023 09:03:09 GMT",
"properties": {
"name": "My-Farm"
}
},
"resourceGroup": "ITSS_Nh%C3%BAng",
"type": "Microsoft.Devices/IotHubs/EventHubEndpoints/ConsumerGroups"
}
pham [ ~ ]$ az iot hub connection-string show --hub-name Arimaa-IoT-Hub --policy-name service
The command requires the extension azure-iot. Do you want to install it now? The command will continue to run after the extension is installed. (Y/n): Y
Run 'az config set extension.use_dynamic_install=yes_without_prompt' to allow installing extensions without prompt.
{- Installing ..
"connectionString": "HostName=Arimaa-IoT-Hub.azure-devices.net;SharedAccessKeyName=service;SharedAccessKey=E5mpGHtp5qlZIsbSBG7d4YTvBuryf2Kya0VSbhuODoY="
}

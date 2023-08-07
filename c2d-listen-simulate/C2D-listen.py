import time
from azure.iot.device import IoTHubDeviceClient
import threading
import cv2
import numpy as np

# Lỗi chưa Ctrl + C để thoát được

lock = threading.Lock()

MESSAGE_TEXT = ""

RECEIVED_MESSAGES = 0
# CONNECTION_STRING = "HostName=ITSS-nhung-01.azure-devices.net;DeviceId=listen-rp-1;SharedAccessKey=F7zNLR0X8+NIWmUWVivE1ILYxYl9t06J6h8vzoMpcRQ="
CONNECTION_STRING = "HostName=Arimaa-IoT-Hub.azure-devices.net;DeviceId=listen-device-1;SharedAccessKey=NaNSoOnLZL+Nf08B62Bc1ViVlRhihJR4kn7Vg4VH7Sc="

def message_handler(message):
    global RECEIVED_MESSAGES
    RECEIVED_MESSAGES += 1
    print("")
    print("Message received:")

    with lock:
        global MESSAGE_TEXT
        MESSAGE_TEXT = message.data.decode("utf-8")
        print(f"Message text: {MESSAGE_TEXT}")

    # # print data from both system and application (custom) properties
    # for property in vars(message).items():
    #     print ("    {}".format(property))

    print("Total calls received: {}".format(RECEIVED_MESSAGES))

def thread_receive_mesage():
    print ("Starting the Python IoT Hub C2D Messaging device sample...")

    # Instantiate the client
    client = IoTHubDeviceClient.create_from_connection_string(CONNECTION_STRING)

    print ("Waiting for C2D messages, press Ctrl-C to exit")
    try:
        # Attach the handler to the client
        client.on_message_received = message_handler

        while True:
            time.sleep(1000)
    except KeyboardInterrupt:
        print("IoT Hub C2D Messaging device sample stopped")
    finally:
        # Graceful exit
        print("Shutting down IoT Hub Client")
        client.shutdown()

def thread_display_message():
    current_message = ""
    global MESSAGE_TEXT
    show = np.zeros((500, 1000, 3), np.uint8)
    tuoi = np.zeros((500, 500, 3), np.uint8)
    suoi = np.zeros((500, 500, 3), np.uint8)
    bat_tuoi = cv2.imread("bat-tuoi.png")
    bat_tuoi = cv2.resize(bat_tuoi, (500, 500), interpolation=cv2.INTER_AREA)
    tat_tuoi = cv2.imread("tat-tuoi.png")
    tat_tuoi = cv2.resize(tat_tuoi, (500, 500), interpolation=cv2.INTER_AREA)
    bat_suoi = cv2.imread("bat-suoi.png")
    bat_suoi = cv2.resize(bat_suoi, (500, 500), interpolation=cv2.INTER_AREA)
    tat_suoi = cv2.imread("tat-suoi.png")
    tat_suoi = cv2.resize(tat_suoi, (500, 500), interpolation=cv2.INTER_AREA)

    while True:
        time.sleep(0.2)
        try:
            if MESSAGE_TEXT != current_message:
                current_message = MESSAGE_TEXT
                if "bat-tuoi" in current_message:
                    tuoi = bat_tuoi
                elif "tat-tuoi" in current_message:
                    tuoi = tat_tuoi
                    
                if "bat-suoi" in current_message:
                    suoi = bat_suoi
                elif  "tat-suoi" in current_message:
                    suoi = tat_suoi

            show = np.hstack((suoi, tuoi))
            cv2.imshow("Status", show)
            cv2.waitKey(100) 
        except KeyboardInterrupt:
            print("Display message stopped")
            break   


thread1 = threading.Thread(target=thread_receive_mesage)
thread2 = threading.Thread(target=thread_display_message)

thread1.start()
thread2.start()

thread1.join()
thread2.join()

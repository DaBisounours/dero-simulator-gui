package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"path"
	"strconv"
	"strings"
	"syscall"
	"time"

	toml "github.com/pelletier/go-toml/v2"
	runtime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) OpenFile() string {
	f, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{})
	if err != nil {
		fmt.Println(err)
		return ""
	} else {
		return f
	}

}

// CheckFileExists returns a greeting for the given name
func (a *App) CheckFileExists(path string) bool {
	_, error := os.Stat(path)

	// check if error is "file not exists"
	if os.IsNotExist(error) {
		return false
	} else {
		return true
	}
}

type Config struct {
	Path string
}

var config *Config = nil

func initConfig() (string, error) {
	jsonConfig, _ := json.Marshal(config)
	tomlConfig, _ := toml.Marshal(config)
	err := os.WriteFile("config.toml", tomlConfig, 0666)
	if err != nil {
		return "", err
	}
	return string(jsonConfig), nil
}

/* Config enpoints */

const CONFIG_PATH = "config.toml"

func errToStr(err error) string {
	if err != nil {
		return err.Error()
	} else {
		return ""
	}
}

func (a *App) ReadConfig() []string {
	config = &Config{}
	r, err := os.ReadFile(CONFIG_PATH)

	if err != nil {
		fmt.Println("Error reading config file.", err, "Creating one.")
		c, err := initConfig()
		return []string{c, "false", errToStr(err)}
	}

	fmt.Println("Config read:\n", string(r), "\n")
	err = toml.Unmarshal(r, config)

	if err != nil {
		return []string{"", "true", errToStr(err)}
	}

	jsonConfig, err := json.Marshal(config)

	return []string{string(jsonConfig), "true", errToStr(err)}

}

func (a *App) WriteConfig(c string) error {
	err := json.Unmarshal([]byte(c), &config)
	if err != nil {
		return err
	}
	tomlConfig, err := toml.Marshal(config)
	if err != nil {
		return err
	}
	err = os.WriteFile(CONFIG_PATH, tomlConfig, 0666)
	return err
}

/* Simulator enpoints */

func (a *App) StartSimulator(path string) {
	fmt.Println("Starting simulator")
	go startSimulator(path)
}

var end = make(chan byte)
var term = make(chan byte)
var lines []string = make([]string, 0)
var running bool = false

func startSimulator(file_path string) {
	command := exec.Command(file_path)
	dir, _ := path.Split(file_path)
	command.Dir = dir
	buffer := make([]byte, 100, 1000)
	stdoutPipe, _ := command.StdoutPipe()
	str_buffer := ""

	// Buffer reading loop
	go func() {
		for {
			n, err := stdoutPipe.Read(buffer)

			if err == io.EOF {
				stdoutPipe.Close()
				break
			}
			buffer = buffer[0:n]

			str_buffer += string(buffer[:])

			//os.Stdout.Write(buffer)
		}
	}()

	// Parser loop
	go func() {
		for {
			index := strings.Index(str_buffer, "\n")

			if index == -1 {
				time.Sleep(200 * time.Millisecond)
				continue
			}

			// Print to console
			fmt.Print(str_buffer[0 : index+1])

			// Lines to be consumed by frontend
			lines = append(lines, str_buffer[0:index+1])

			str_buffer = str_buffer[index+1:]
		}
	}()

	// Command start and wait
	go func() {
		err := command.Start()
		running = true
		fmt.Println("Simulator started")
		if err != nil {
			fmt.Println(err)
		}
		<-term
		fmt.Println("Sending SIGINT to the simulator")
		command.Process.Signal(syscall.SIGINT)
		fmt.Println("Waiting for simulator to terminate...")
		command.Wait()
		fmt.Println("Simulator closed.")
		running = false
		end <- 0
		end <- 1
	}()

	<-end //0
	lines = make([]string, 0)
}

func (a *App) StopSimulator() {
	fmt.Println("Stopping simulator")
	term <- 0
	<-end //1

}

func (a *App) FetchSimulatorOutput() ([]string, error) {

	if running {
		consumed := lines[:]
		lines = make([]string, 0)
		return consumed, nil
	} else {
		return nil, errors.New("simulator not running")
	}

}

func (a *App) IsSimulatorRunning() bool {
	return running
}

//
// Simulator Wallets endpoints
//

// WalletInfo gets info about a wallet (GetAddress, GetBalance, GetTransfers)
//
// Parameters:
//
//	walletId string - the ID of the wallet to get info (e.g. "wallet_0")
//
// Returns:
//
//	map[string]interface{} - the response as a map
func (a *App) WalletInfo(walletId string) map[string]interface{} {
	walletInfo := make(map[string]interface{})

	// Get address
	res := a.WalletAction(walletId, "GetAddress", "")
	address := res["result"].(map[string]interface{})["address"].(string)
	walletInfo["address"] = address

	// Get balance
	res = a.WalletAction(walletId, "GetBalance", "")
	balance := res["result"].(map[string]interface{})["balance"]
	unlocked_balance := res["result"].(map[string]interface{})["unlocked_balance"]
	walletInfo["balance"] = balance
	walletInfo["unlocked_balance"] = unlocked_balance

	// Get transfers
	params := map[string]interface{}{
		"out":      true,
		"in":       true,
		"coinbase": true,
	}

	res = a.WalletAction(walletId, "GetTransfers", params)
	walletInfo["transfers"] = res

	if DEBUG {
		fmt.Println("walletInfo=", walletInfo)
	}

	return walletInfo
}

const WALLET_BASE_PORT = 30000
const WALLET_IP = "http://127.0.0.1"
const DEBUG = false

// WalletAction performs an action on the specified wallet using the given API endpoint and parameters.
//
// Parameters:
//
//	walletId string - the ID of the wallet to perform the action on (e.g. "wallet_0")
//	action string - the name of the action to perform (e.g. "GetBalance")
//	params interface{} - optional parameters to include in the API request pass empty string to ignore (e.g. "" ["hi", "there"] {"transfers": [{ "destination": "deto1qyj4kx6azntn9psmg7dsfkuv9qs9xde0s94nmmhm2a0damffpm2zzqqcudacc","amount": 100000 }] } )
//
// Returns:
//
//	map[string]interface{} - the response from the API endpoint as a map
func (a *App) WalletAction(walletId string, action string, params interface{}) map[string]interface{} {
	// extract the numeric value from the string
	valueStr := strings.TrimPrefix(walletId, "wallet_")
	value, err := strconv.Atoi(valueStr)
	if err != nil {
		panic(err)
	}
	// Calculate the wallet port number
	port := strconv.Itoa(WALLET_BASE_PORT + value)
	// Set the endpoint URL
	url := WALLET_IP + ":" + port + "/json_rpc"

	// Define the API request
	//action := "GetBalance"
	//params := []interface{}{}
	requestBody := map[string]interface{}{
		"jsonrpc": "2.0",
		"id":      "1",
		"method":  action,
	}

	if params != "" {
		requestBody["params"] = params
	}

	// Send the request to the API endpoint
	response, err := sendRequest(url, requestBody)
	if err != nil {
		panic(err)
	}

	// Print the result of the API endpoint
	/*
		switch action {
		case "Echo":
			fmt.Println(response["result"])
		case "GetAddress":
			fmt.Println(response["result"].(map[string]interface{})["address"])
		case "GetBalance":
			fmt.Println(response["result"].(map[string]interface{})["balance"])
		default:
			fmt.Println("Unknown action:", action)
		}
	*/

	// Return response
	return response
}

// Sends a POST request to the specified URL with the given request body
// Returns the response body as a map[string]interface{}
func sendRequest(url string, requestBody map[string]interface{}) (map[string]interface{}, error) {
	if DEBUG {
		fmt.Println("Wallet API url=", url, "request=", requestBody)
	}
	// Convert the request body to JSON format
	requestBodyJson, err := json.Marshal(requestBody)
	if err != nil {
		return nil, err
	}

	// Create a new POST request with the request body
	request, err := http.NewRequest("POST", url, bytes.NewBuffer(requestBodyJson))
	if err != nil {
		return nil, err
	}
	request.Header.Set("Content-Type", "application/json")

	// Send the request and get the response
	client := &http.Client{}
	response, err := client.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	// Read the response body
	responseBody, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	// Parse the response body to a map[string]interface{}
	var responseMap map[string]interface{}
	err = json.Unmarshal(responseBody, &responseMap)
	if err != nil {
		return nil, err
	}

	if DEBUG {
		fmt.Println("resposeMap=", responseMap)
	}
	return responseMap, nil
}

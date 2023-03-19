package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path"
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

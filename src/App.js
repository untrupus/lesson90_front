import React, {useState, useRef, useEffect} from 'react';
import "./App.css";

const App = () => {
    const [pixels, setPixels] = useState([]);
    const [state, setState] = useState({
        mouseDown: false,
        pixelsArray: []
    });

    const [options, setOptions] = useState({
        color: '',
        size: 5
    });

    const ws = useRef(null);

    useEffect(() => {
        ws.current = new WebSocket("ws://localhost:8000");

        ws.current.onopen = () => {
            ws.current.send(JSON.stringify({type: "GET_ALL_PIXELS"}));
        };

        ws.current.onmessage = e => {
            const decodedMessage = JSON.parse(e.data);
            if (decodedMessage.type === "NEW_PIXEL") {
                setPixels(pixels => [...pixels, ...decodedMessage.newPixels]);
            } else if (decodedMessage.type === "ALL_PIXELS") {
                setPixels(pixels => [...pixels, ...decodedMessage.pixels]);
            }
        };

        ws.current.onclose = () => console.log("ws connection closed");

        return () => ws.current.close();
    }, []);

    const canvas = useRef();

    useEffect(() => {
        pixels.forEach(pixel => {
            const context = canvas.current.getContext('2d');
            context.fillStyle = pixel.color;
            context.beginPath();
            context.arc(pixel.x, pixel.y, pixel.size, 0, Math.PI * 2, true);
            context.closePath();
            context.fill();
            const imageData = context.createImageData(1, 1);
            context.putImageData(imageData, pixel.x, pixel.y);
        });
    }, [pixels]);

    const canvasMouseMoveHandler = event => {
        if (state.mouseDown) {
            event.persist();
            const clientX = event.clientX;
            const clientY = event.clientY;
            setState(prevState => {
                return {
                    ...prevState,
                    pixelsArray: [...prevState.pixelsArray, {
                        x: clientX,
                        y: clientY,
                        color: options.color,
                        size: options.size
                    }]
                };
            });
            const context = canvas.current.getContext('2d');
            context.fillStyle = options.color;
            context.beginPath();
            context.arc(clientX, clientY, options.size, 0, Math.PI * 2, true);
            context.closePath();
            context.fill();
            const imageData = context.createImageData(1, 1);
            context.putImageData(imageData, event.clientX, event.clientY);
        }
    };


    const mouseDownHandler = event => {
        setState({...state, mouseDown: true});
    };
    const mouseUpHandler = event => {
        ws.current.send(JSON.stringify({
            type: "CREATE_PIXELS",
            newPixels: state.pixelsArray
        }));
        setState({...state, mouseDown: false, pixelsArray: []});
    };

    const inputChangeHandler = e => {
        const name = e.target.name;
        const value = e.target.value;
        setOptions(prevState => {
            return {...prevState, [name]: value};
        });
    };

    return (
        <>
            <div>
                <canvas
                    ref={canvas}
                    style={{border: '1px solid black'}}
                    width={800}
                    height={600}
                    onMouseDown={mouseDownHandler}
                    onMouseUp={mouseUpHandler}
                    onMouseMove={canvasMouseMoveHandler}
                />
            </div>
            <input
                type="color"
                className="field"
                name="color"
                onClick={inputChangeHandler}
            />
            <input
                type="text"
                className="field"
                placeholder="Size"
                name="size"
                onClick={inputChangeHandler}
            />
        </>
    );

};

export default App;


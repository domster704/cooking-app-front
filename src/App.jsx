import React from "react";
import {createAssistant, createSmartappDebugger,} from "@salutejs/client";

import "./App.css";
import "./voiceSber.css";
import {CardsList} from './pages/CardsList';
import {addRecipe, removeRecipe} from "./store/recipeSlice";
import {connect} from "react-redux";


const initializeAssistant = (getState/*: any*/) => {
    if (process.env.NODE_ENV === "development") {
        return createSmartappDebugger({
            token: process.env.REACT_APP_TOKEN ?? "",
            // initPhrase: `Запусти ${process.env.REACT_APP_SMARTAPP}`,
            getState,
        });
    }
    return createAssistant({getState});
};


class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            cards: [],
        }

        this.assistant = initializeAssistant(() => this.getStateForAssistant());

        this.assistant.on("data", (event/*: any*/) => {
            if (event.type === "character") {

            } else if (event.type === "insets") {

            } else {
                const {action} = event;
                this.dispatchAssistantAction(action);
            }
        });

        this.assistant.on("start", (event) => {
            let initialData = this.assistant.getInitialData();
        });

        this.assistant.on("command", (event) => {
        });

        this.assistant.on("error", (event) => {
        });

        this.assistant.on("tts", (event) => {
        });
    }

    componentDidMount() {
    }

    getStateForAssistant() {
        return {
            item_selector: {
                items: this.props.recipes.map(
                    ({id, question, answer}, index) => ({
                        number: index + 1,
                        id,
                        question,
                        answer
                    })
                ),
            },
        };
    }

    dispatchAssistantAction(action) {
        if (!action) {
            return
        }

        switch (action.type) {
            case 'add_note':
                return this.new_card(action);
            case 'done_note':
                return this.done_note(action);
            default:
                throw new Error();
        }
    }

    new_card(action) {
        this.props.addRecipe({
            id: Math.random().toString(36).substring(7),
            title: action.note,
            completed: false,
            description: '',
            ingredients: '',
            tags: []
        });
    }

    done_note(action) {
        this.props.removeRecipe(action.id);
    }

    _send_action_value(action_id, value) {
        const data = {
            action: {
                action_id: action_id,
                parameters: {   // значение поля parameters может любым, но должно соответствовать серверной логике
                    value: value, // см.файл src/sc/noteDone.sc смартаппа в Studio Code
                }
            }
        };
        const unsubscribe = this.assistant.sendData(
            data,
            (data) => {   // функция, вызываемая, если на sendData() был отправлен ответ
                const {type, payload} = data;
                unsubscribe();
            });
    }

    play_done_note(id) {
        const completed = this.props.recipes.find(({id}) => id)?.completed;
        if (!completed) {
            const texts = ['Молодец!', 'Красавчик!', 'Супер!'];
            const idx = Math.random() * texts.length | 0;
            this._send_action_value('done', texts[idx]);
        }
    }

    delete_note(action) {
        this.props.removeRecipe(action.id);
    }

    render() {
        return (
            // <div className=""></div>
            <CardsList
                items={Object.keys(this.props.recipes).map(key => this.props.recipes[key])}
                onAdd={(note) => {
                    this.new_card({type: "add_note", note});
                }}
                onDone={(note) => {
                    this.play_done_note(note.id);
                    this.done_note({type: "done_note", id: note.id});
                }}
            />
        )
    }
}

const mapStateToProps = state => {
    return {
        recipes: state.recipes,
    }
}

const mapDispatchToProps = dispatch => {
    return {
        addRecipe: (action) => dispatch(addRecipe(action)),
        removeRecipe: (action) => dispatch(removeRecipe(action))
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(App);

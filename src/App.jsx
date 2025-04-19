import {useState, useEffect, useRef} from "react";
import "./App.css";
import controller_sala_virtual from "./controller_sala_virtual";
import {ListaJogadores} from "./Jogador";

const PUBLIC_BASE_URL = import.meta.env.PUBLIC_BASE_URL || "ws://localhost:50010";

export default function SalaVirtual() {
    const [hoverButton, setHoverButton] = useState(false);
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const teclasPresionadas = useRef({cima: false, baixo: false, esquerda: false, direita: false});
    const frameRef = useRef(null);

    const useNome = controller_sala_virtual.contexto.jsx.get_nome();
    const useSala = controller_sala_virtual.contexto.jsx.get_sala();
    const useCor = controller_sala_virtual.contexto.jsx.get_cor();
    const useConectado = controller_sala_virtual.contexto.jsx.get_conectado();
    const useConectando = controller_sala_virtual.contexto.jsx.get_conectando();
    const useErroConexao = controller_sala_virtual.contexto.jsx.get_erro_conexao();
    const useJogadorAtual = controller_sala_virtual.contexto.jsx.get_jogador_atual();
    const useMensagens = controller_sala_virtual.contexto.jsx.get_mensagens();
    const useMensagemAtual = controller_sala_virtual.contexto.jsx.get_mensagem_atual();
    const useInputFocado = controller_sala_virtual.contexto.jsx.get_input_focado();
    const useJogadores = controller_sala_virtual.contexto.jsx.get_jogadores();

    const salaRef = useRef(null);
    const inputChatRef = useRef(null);
    const chatBoxRef = useRef(null);
    const isMobileRef = useRef(window.innerWidth <= 768);

    useEffect(() => {
        const checkMobile = () => {
            isMobileRef.current = window.innerWidth <= 768;
        };

        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [useMensagens]);

    const conectarAoServidor = async () => {
        if (!useNome.trim()) {
            alert("Por favor, digite seu nome!");
            return;
        }

        await controller_sala_virtual.api.conectar(PUBLIC_BASE_URL);
    };

    const enviarMensagem = () => {
        if (!useMensagemAtual.trim()) return;

        const enviado = controller_sala_virtual.websocket.enviarMensagem(useMensagemAtual);

        if (enviado) {
            controller_sala_virtual.contexto.state.set_mensagem_atual("");
            if (inputChatRef.current) {
                inputChatRef.current.focus();
            }
        }
    };

    const atualizarPosicaoJogador = (novaPosicao) => {
        if (!useJogadorAtual) return;
        controller_sala_virtual.websocket.enviarMovimento(novaPosicao);
    };

    const verificarTeclasPressionadas = () => {
        if (!useJogadorAtual || useInputFocado) return;

        const teclas = teclasPresionadas.current;
        const velocidade = 5;

        if (teclas.cima) {
            const novaPosicao = {...useJogadorAtual.posicao};
            novaPosicao.y = Math.max(70, novaPosicao.y - velocidade);
            atualizarPosicaoJogador(novaPosicao);
        }
        if (teclas.baixo) {
            const novaPosicao = {...useJogadorAtual.posicao};
            const altura = salaRef.current ? salaRef.current.clientHeight : 600;
            novaPosicao.y = Math.min(altura - 70, novaPosicao.y + velocidade);
            atualizarPosicaoJogador(novaPosicao);
        }
        if (teclas.esquerda) {
            const novaPosicao = {...useJogadorAtual.posicao};
            novaPosicao.x = Math.max(40, novaPosicao.x - velocidade);
            atualizarPosicaoJogador(novaPosicao);
        }
        if (teclas.direita) {
            const novaPosicao = {...useJogadorAtual.posicao};
            const largura = salaRef.current ? salaRef.current.clientWidth : 800;
            novaPosicao.x = Math.min(largura - 40, novaPosicao.x + velocidade);
            atualizarPosicaoJogador(novaPosicao);
        }

        frameRef.current = requestAnimationFrame(verificarTeclasPressionadas);
    };

    useEffect(() => {
        if (useConectado && useJogadorAtual && !useInputFocado) {
            frameRef.current = requestAnimationFrame(verificarTeclasPressionadas);
        } else if (frameRef.current) {
            cancelAnimationFrame(frameRef.current);
        }

        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, [useConectado, useJogadorAtual, useInputFocado]);

    useEffect(() => {
        return () => {
            controller_sala_virtual.api.desconectar();
        };
    }, []);

    useEffect(() => {
        if (!useConectado) return;

        const handleEnterKey = (e) => {
            if (e.key === "Enter" && useInputFocado) {
                enviarMensagem();
                e.preventDefault();
            }
        };

        window.addEventListener("keydown", handleEnterKey);
        return () => window.removeEventListener("keydown", handleEnterKey);
    }, [useConectado, useInputFocado, useMensagemAtual]);

    const iniciarMovimentoContinuo = (direcao) => {
        teclasPresionadas.current[direcao] = true;
        if (!frameRef.current && !useInputFocado) {
            frameRef.current = requestAnimationFrame(verificarTeclasPressionadas);
        }
    };

    const pararMovimentoContinuo = (direcao) => {
        teclasPresionadas.current[direcao] = false;
    };

    const toggleSidebar = () => {
        setSidebarVisible(!sidebarVisible);
    };

    if (!useConectado) {
        return (
            <div className="login-screen">
                <div className="login-box">
                    <h1 className="title">Sala Virtual WebSocket</h1>

                    <div>
                        <div className="form-group">
                            <label className="label">Seu nome</label>
                            <input
                                type="text"
                                value={useNome}
                                onChange={(e) => controller_sala_virtual.contexto.state.set_nome(e.target.value)}
                                className="input"
                                placeholder="Digite seu nome"
                                autoComplete="off"
                            />
                        </div>

                        <div className="form-group">
                            <label className="label">ID da Sala</label>
                            <input
                                type="text"
                                value={useSala}
                                onChange={(e) => controller_sala_virtual.contexto.state.set_sala(e.target.value)}
                                className="input"
                                placeholder="ID da sala (ex: sala1)"
                                autoComplete="off"
                            />
                        </div>

                        <div className="form-group">
                            <label className="label">Cor do personagem</label>
                            <div className="color-picker">
                                {["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"].map((cor) => (
                                    <div
                                        key={cor}
                                        onClick={() => controller_sala_virtual.contexto.state.set_cor(cor)}
                                        className={`color-option ${useCor === cor ? "selected" : ""}`}
                                        style={{backgroundColor: cor}}
                                    />
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={conectarAoServidor}
                            onMouseEnter={() => setHoverButton(true)}
                            onMouseLeave={() => setHoverButton(false)}
                            className={`button ${hoverButton ? "hover" : ""}`}
                            disabled={useConectando}
                        >
                            {useConectando ? "Conectando..." : "Entrar na Sala"}
                        </button>

                        {useErroConexao && <div className="error-message">{useErroConexao}</div>}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`app ${sidebarVisible ? "sidebar-visible" : ""}`}>
            <div className="game-area" ref={salaRef}>
                <div className="room">
                    <div className="grid"></div>

                    <ListaJogadores roomRef={salaRef} teclasPresionadas={teclasPresionadas} atualizarPosicaoJogador={atualizarPosicaoJogador} />

                    <div className="controls">
                        <div></div>
                        <button
                            onMouseDown={() => iniciarMovimentoContinuo("cima")}
                            onMouseUp={() => pararMovimentoContinuo("cima")}
                            onMouseLeave={() => pararMovimentoContinuo("cima")}
                            onTouchStart={(e) => {
                                e.preventDefault();
                                iniciarMovimentoContinuo("cima");
                            }}
                            onTouchEnd={() => pararMovimentoContinuo("cima")}
                            className="control-btn"
                        >
                            ↑
                        </button>
                        <div></div>
                        <button
                            onMouseDown={() => iniciarMovimentoContinuo("esquerda")}
                            onMouseUp={() => pararMovimentoContinuo("esquerda")}
                            onMouseLeave={() => pararMovimentoContinuo("esquerda")}
                            onTouchStart={(e) => {
                                e.preventDefault();
                                iniciarMovimentoContinuo("esquerda");
                            }}
                            onTouchEnd={() => pararMovimentoContinuo("esquerda")}
                            className="control-btn"
                        >
                            ←
                        </button>
                        <button
                            onMouseDown={() => iniciarMovimentoContinuo("baixo")}
                            onMouseUp={() => pararMovimentoContinuo("baixo")}
                            onMouseLeave={() => pararMovimentoContinuo("baixo")}
                            onTouchStart={(e) => {
                                e.preventDefault();
                                iniciarMovimentoContinuo("baixo");
                            }}
                            onTouchEnd={() => pararMovimentoContinuo("baixo")}
                            className="control-btn"
                        >
                            ↓
                        </button>
                        <button
                            onMouseDown={() => iniciarMovimentoContinuo("direita")}
                            onMouseUp={() => pararMovimentoContinuo("direita")}
                            onMouseLeave={() => pararMovimentoContinuo("direita")}
                            onTouchStart={(e) => {
                                e.preventDefault();
                                iniciarMovimentoContinuo("direita");
                            }}
                            onTouchEnd={() => pararMovimentoContinuo("direita")}
                            className="control-btn"
                        >
                            →
                        </button>
                    </div>

                    <div className="mode-indicator">{useInputFocado ? "Digite sua mensagem" : "Use as setas para se mover"}</div>
                    <div className="status-indicator">{useConectado ? "Conectado ✓" : "Conectando..."}</div>
                </div>
            </div>

            <div className="sidebar">
                <h2 className="sidebar-title">Sala: {useSala}</h2>
                <h2 className="sidebar-title">Jogadores Online ({Object.keys(useJogadores).length})</h2>
                <div className="player-list">
                    {Object.values(useJogadores).map((jogador) => (
                        <div key={jogador.id} className="player-item">
                            <div className="player-color" style={{backgroundColor: jogador.cor}} />
                            <span className="player-name">
                                {jogador.nome} {useJogadorAtual && jogador.id === useJogadorAtual.id ? "(você)" : ""}
                            </span>
                        </div>
                    ))}
                </div>

                <h2 className="sidebar-title">Chat</h2>
                <div className="chat-box" ref={chatBoxRef}>
                    {useMensagens.map((msg, index) => (
                        <div key={index} className="chat-message">
                            <span className="chat-time">{msg.hora}</span>
                            <div>
                                <span className={`chat-sender ${msg.sender === "Sistema" ? "system" : ""}`}>{msg.sender}:</span>
                                <span className="chat-text"> {msg.texto}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="chat-input">
                    <input
                        ref={inputChatRef}
                        type="text"
                        value={useMensagemAtual}
                        onChange={(e) => controller_sala_virtual.contexto.state.set_mensagem_atual(e.target.value)}
                        onFocus={() => controller_sala_virtual.contexto.state.set_input_focado(true)}
                        onBlur={() => controller_sala_virtual.contexto.state.set_input_focado(false)}
                        className="input-field"
                        placeholder="Digite uma mensagem"
                        autoComplete="off"
                    />
                    <button onClick={enviarMensagem} className="send-button">
                        Enviar
                    </button>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from "react";

const Login = ({ login, register }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const submit = (ev) => {
        ev.preventDefault();
        if (document.activeElement.value === "login") {
            login({ username, password });
        } else if (document.activeElement.value === "register") {
            register({ username, password });
        }
    };
    return (
        <form onSubmit={submit}>
            <input
                value={username}
                placeholder="username"
                onChange={(ev) => setUsername(ev.target.value)}
            />
            <input
                value={password}
                placeholder="password"
                onChange={(ev) => setPassword(ev.target.value)}
            />
            <button
                disabled={!username || !password}
                name="login"
                value="login"
            >
                Login
            </button>
            <button
                disabled={!username || !password}
                name="register"
                value="register"
            >
                Register
            </button>
        </form>
    );
};

function App() {
    const [auth, setAuth] = useState({});
    const [products, setProducts] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [message, setMessage] = useState("");

    useEffect(() => {
        attemptLoginWithToken();
    }, []);

    const attemptLoginWithToken = async () => {
        const token = window.localStorage.getItem("token");
        if (token) {
            const response = await fetch(`/api/auth/me`, {
                headers: {
                    authorization: token,
                },
            });
            const json = await response.json();
            if (response.ok) {
                setAuth(json);
            } else {
                window.localStorage.removeItem("token");
            }
        }
    };

    useEffect(() => {
        const fetchProducts = async () => {
            const response = await fetch("/api/products");
            const json = await response.json();
            setProducts(json);
        };

        fetchProducts();
    }, []);

    useEffect(() => {
        const fetchFavorites = async () => {
            const response = await fetch(`/api/users/${auth.id}/favorites`, {
                headers: {
                    authorization: window.localStorage.getItem("token"),
                },
            });
            const json = await response.json();
            if (response.ok) {
                setFavorites(json);
            }
        };
        if (auth.id) {
            fetchFavorites();
        } else {
            setFavorites([]);
        }
    }, [auth]);

    const register = async (credentials) => {
        setMessage("");
        const response = await fetch("/api/auth/register", {
            method: "POST",
            body: JSON.stringify(credentials),
            headers: {
                "Content-Type": "application/json",
            },
        });

        const json = await response.json();
        if (response.ok) {
            window.localStorage.setItem("token", json.token);
            attemptLoginWithToken();
        } else {
            console.log(json);
            setMessage(json.error);
        }
    };

    const login = async (credentials) => {
        setMessage("");
        const response = await fetch("/api/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials),
            headers: {
                "Content-Type": "application/json",
            },
        });

        const json = await response.json();
        if (response.ok) {
            window.localStorage.setItem("token", json.token);
            attemptLoginWithToken();
        } else {
            console.log(json);
            setMessage(json.error);
        }
    };

    const addFavorite = async (product_id) => {
        setMessage("");
        const response = await fetch(`/api/users/${auth.id}/favorites`, {
            method: "POST",
            body: JSON.stringify({ product_id }),
            headers: {
                "Content-Type": "application/json",
                authorization: window.localStorage.getItem("token"),
            },
        });

        const json = await response.json();
        if (response.ok) {
            setFavorites([...favorites, json]);
        } else {
            console.log(json);
            setMessage(json.error);
        }
    };

    const removeFavorite = async (id) => {
        setMessage("");
        const response = await fetch(`/api/users/${auth.id}/favorites/${id}`, {
            method: "DELETE",
            headers: { authorization: window.localStorage.getItem("token") },
        });

        const json = await response.json();
        if (response.ok) {
            setFavorites(favorites.filter((favorite) => favorite.id !== id));
        } else {
            console.log(json);
            setMessage(json.error);
        }
    };

    const logout = () => {
        window.localStorage.removeItem("token");
        setAuth({});
        setMessage("");
    };

    return (
        <>
            {!auth.id ? (
                <Login login={login} register={register} />
            ) : (
                <button onClick={logout}>Logout {auth.username}</button>
            )}
            <ul>
                {products.map((product) => {
                    const isFavorite = favorites.find(
                        (favorite) => favorite.product_id === product.id
                    );
                    return (
                        <li
                            key={product.id}
                            className={isFavorite ? "favorite" : ""}
                        >
                            {product.name}
                            {auth.id && isFavorite && (
                                <button
                                    onClick={() =>
                                        removeFavorite(isFavorite.id)
                                    }
                                >
                                    -
                                </button>
                            )}
                            {auth.id && !isFavorite && (
                                <button onClick={() => addFavorite(product.id)}>
                                    +
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>
            {message !== "" && (
                <div>
                    <h3>{message}</h3>
                </div>
            )}
        </>
    );
}

export default App;

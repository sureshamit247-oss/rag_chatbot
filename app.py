# app.py
import os
import streamlit as st
import webbrowser
from datetime import datetime

# LangChain imports
from langchain.chat_models import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain.document_loaders import PyPDFLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.memory import ConversationBufferMemory

# Page config
st.set_page_config(page_title="RAG Chatbot", layout="wide")
st.title("🤖 RAG Chatbot — Registration + Document RAG + YouTube")

# ------------------------ Sidebar ------------------------
st.sidebar.header("Configuration")
openai_key_input = st.sidebar.text_input("OpenAI API Key", type="password")
persist_index = st.sidebar.checkbox("Persist Chroma index to disk", value=False)
index_path = st.sidebar.text_input("Index path (if persisting)", value="chroma_db")

if openai_key_input:
    os.environ["OPENAI_API_KEY"] = openai_key_input

# ------------------------ Registration Form ------------------------
st.header("1) Register")
if "profile" not in st.session_state:
    st.session_state.profile = {}
if "registered" not in st.session_state:
    st.session_state.registered = False

with st.form("registration_form"):
    name = st.text_input("Full name")
    dob = st.date_input("Date of birth", value=datetime(1990, 1, 1))
    location = st.text_input("Location / City")
    email = st.text_input("Email")
    contact = st.text_input("Contact number")
    country = st.text_input("Country living")
    hobbies = st.text_area("Hobbies / Interests (e.g., listening to Telugu songs of 2024 movies)")

    submitted = st.form_submit_button("Register")

if submitted:
    st.session_state.profile = {
        "name": name,
        "dob": str(dob),
        "location": location,
        "email": email,
        "contact": contact,
        "country": country,
        "hobbies": hobbies,
    }
    st.session_state.registered = True
    st.success(f"Registered {name}. You can upload documents and chat below.")

# ------------------------ Document Upload ------------------------
st.header("2) Upload & Index Documents (for RAG)")
st.markdown("Upload PDFs or TXT files. The app will chunk them, embed using OpenAI embeddings, and index into ChromaDB.")

if "vectorstore" not in st.session_state:
    st.session_state.vectorstore = None

uploaded_files = st.file_uploader("Upload PDF or TXT files", type=["pdf", "txt"], accept_multiple_files=True)

if st.button("Ingest uploaded files") and uploaded_files:
    if not openai_key_input:
        st.error("Set your OpenAI API Key in the sidebar first.")
    else:
        with st.spinner("Loading, splitting, embedding and indexing documents..."):
            docs = []
            for f in uploaded_files:
                if f.name.lower().endswith(".pdf"):
                    loader = PyPDFLoader(f)
                    docs.extend(loader.load())
                else:
                    loader = TextLoader(f)
                    docs.extend(loader.load())

            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
            splits = text_splitter.split_documents(docs)

            embeddings = OpenAIEmbeddings()
            vectorstore = Chroma.from_documents(splits, embeddings, persist_directory="chroma_db" if persist_index else None)

            st.session_state.vectorstore = vectorstore
            st.success(f"Indexed {len(splits)} chunks from {len(uploaded_files)} files.")

# Load persisted index
if persist_index and st.button("Load persisted index from disk"):
    try:
        embeddings = OpenAIEmbeddings()
        vs = Chroma(persist_directory="chroma_db", embedding_function=embeddings)
        st.session_state.vectorstore = vs
        st.success("Loaded persisted Chroma index.")
    except Exception as e:
        st.error(f"Failed to load index: {e}")

# ------------------------ Chat Section ------------------------
st.header("3) Chat with the RAG Bot")
if not st.session_state.registered:
    st.info("Please register first to use the chat.")
else:
    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []

    user_question = st.text_input("Ask a question or type a hobby (e.g., 'play Telugu songs of 2024'):")
    send = st.button("Send")

    if send and user_question:
        q_lower = user_question.lower()
        music_keywords = ["play", "listen", "song", "music", "youtube", "songs"]
        if any(k in q_lower for k in music_keywords):
            query = user_question.strip() or st.session_state.profile.get("hobbies", "")
            if query:
                query_for_yt = "+".join(query.split())
                yt_url = f"https://www.youtube.com/results?search_query={query_for_yt}"
                st.session_state.chat_history.append(("assistant", f"Opening YouTube: {query_for_yt}"))
                st.success(f"Opening YouTube results for: {query_for_yt}")
                try:
                    webbrowser.open_new_tab(yt_url)
                except Exception:
                    st.write(f"YouTube URL: {yt_url}")
        else:
            if st.session_state.vectorstore is None:
                if not openai_key_input:
                    st.error("Set your OpenAI API Key in the sidebar.")
                else:
                    llm = ChatOpenAI(temperature=0)
                    answer = llm.predict(user_question)
                    st.session_state.chat_history.append(("user", user_question))
                    st.session_state.chat_history.append(("assistant", answer))
            else:
                llm = ChatOpenAI(temperature=0)
                retriever = st.session_state.vectorstore.as_retriever(search_kwargs={"k": 4})
                rag = ConversationalRetrievalChain.from_llm(llm=llm, retriever=retriever)
                history = [(u, a) for (u, a) in pair_chat_history(st.session_state.chat_history)]
                result = rag({"question": user_question, "chat_history": history})
                answer = result["answer"]
                st.session_state.chat_history.append(("user", user_question))
                st.session_state.chat_history.append(("assistant", answer))

    # Display chat
    if st.session_state.get("chat_history"):
        for role, text in st.session_state.chat_history:
            if role == "user":
                st.markdown(f"**You:** {text}")
            else:
                st.markdown(f"**Bot:** {text}")

# ------------------------ Helper Functions ------------------------
def pair_chat_history(flat_history):
    pairs = []
    u = None
    a = None
    for role, msg in flat_history:
        if role == "user":
            u = msg
        elif role == "assistant":
            a = msg
        if u is not None and a is not None:
            pairs.append((u, a))
            u = None
            a = None
    return pairs

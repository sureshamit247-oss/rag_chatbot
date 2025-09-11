# app.py

import streamlit as st
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.chains import RetrievalQA
from langchain_community.llms import OpenAI

# -------------------------------
# 1. Load OpenAI API Key
# -------------------------------
# Make sure you add your API key in Streamlit secrets:
# [OPENAI]
# OPENAI_API_KEY = "sk-xxxx..."

api_key = st.secrets["OPENAI_API_KEY"]

if not api_key:
    st.error("Please set your OPENAI_API_KEY in Streamlit secrets.")
    st.stop()

# -------------------------------
# 2. Initialize Embeddings
# -------------------------------
embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",
    openai_api_key=api_key
)

# -------------------------------
# 3. Load Documents (example)
# -------------------------------
docs = [
    "Paris is the capital of France.",
    "The Eiffel Tower is in Paris.",
    "Python is a popular programming language."
]

# Split documents into chunks
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=50)
chunks = text_splitter.split_documents(docs)

# Create/load FAISS vector store
if st.secrets.get("FAISS_INDEX_EXISTS"):
    vectorstore = FAISS.load_local("faiss_index", embeddings)
else:
    vectorstore = FAISS.from_documents(chunks, embeddings)
    vectorstore.save_local("faiss_index")

# -------------------------------
# 4. Setup QA chain
# -------------------------------
qa_chain = RetrievalQA.from_chain_type(
    llm=OpenAI(temperature=0, openai_api_key=api_key),
    retriever=vectorstore.as_retriever(),
    return_source_documents=True
)

# -------------------------------
# 5. Streamlit UI
# -------------------------------
st.title("📚 RAG Chatbot")

user_query = st.text_input("Ask a question about your documents:")

if user_query:
    with st.spinner("Thinking..."):
        result = qa_chain.run(user_query)
    st.subheader("Answer:")
    st.write(result)
# Old (failing)
from langchain_community.text_splitter import RecursiveCharacterTextSplitter

# Try this instead
from langchain_community.text_splitters import RecursiveCharacterTextSplitter



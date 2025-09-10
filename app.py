import streamlit as st
from langchain_openai import ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import OpenAIEmbeddings
from langchain.text_splitter import CharacterTextSplitter
from langchain.docstore.document import Document

# -----------------------------
# Streamlit App: User Registration
# -----------------------------
st.title("🤖 RAG Chatbot - User Registration")

with st.form("registration_form"):
    name = st.text_input("Full Name")
    dob = st.date_input("Date of Birth")
    location = st.text_input("Location")
    email = st.text_input("Email")
    contact = st.text_input("Contact Number")
    country = st.text_input("Country of Living")
    hobbies = st.text_area("Your Hobbies (e.g. listening to Telugu songs of 2024 movies)")

    submitted = st.form_submit_button("Register")

if submitted:
    st.success(f"Welcome {name}! 🎉")
    st.write("Your registration details have been saved.")
    st.write(f"**Hobbies:** {hobbies}")

    # -----------------------------
    # Show YouTube links based on hobbies
    # -----------------------------
    if "telugu" in hobbies.lower():
        st.video("https://www.youtube.com/watch?v=abcd1234")  # Replace with real Telugu playlist
    elif "cricket" in hobbies.lower():
        st.video("https://www.youtube.com/watch?v=wxyz5678")  # Replace with real Cricket video
    else:
        st.write("No specific hobby detected. Try adding 'Telugu songs' or 'Cricket'.")

# -----------------------------
# Example: RAG Chatbot (demo)
# -----------------------------
if st.button("Start Chatbot"):
    st.write("🔗 Initializing chatbot...")

    embeddings = OpenAIEmbeddings()
    texts = ["This is a demo document for RAG chatbot.", "LangChain makes RAG easy."]
    docs = [Document(page_content=t) for t in texts]

    text_splitter = CharacterTextSplitter(chunk_size=50, chunk_overlap=10)
    split_docs = text_splitter.split_documents(docs)

    vectorstore = FAISS.from_documents(split_docs, embeddings)
    retriever = vectorstore.as_retriever()

    llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
    query = "What is this chatbot about?"
    retrieved_docs = retriever.get_relevant_documents(query)
    st.write("📄 Retrieved context:", retrieved_docs)
    st.write("💡 Chatbot response:", llm.invoke(query))

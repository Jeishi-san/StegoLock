import ClientUserLayout from "../Layouts/ClientUserLayout";

function MyDocuments() {
     return (
        <div>
            My Documents
        </div>
    );
}

MyDocuments.layout = page => <ClientUserLayout children={page} />

export default MyDocuments;

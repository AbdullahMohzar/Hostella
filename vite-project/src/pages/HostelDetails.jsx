import { useParams } from 'react-router-dom';

function HostelDetails() {
  const { id } = useParams();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Hostel ID: {id}</h1>
      <div>Images: [Placeholder Gallery]</div>
      <div>Amenities: [List Placeholder]</div>
      <div>Chat with Manager: [Chat Skeleton]</div>
    </div>
  );
}

export default HostelDetails;
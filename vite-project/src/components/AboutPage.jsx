import './AboutPage.css'

function AboutPage() {
  return (
    <div className="about-page">
      <div className="about-container">
        <h1>About Hostella</h1>
        <p>
          Hostella is your trusted platform for finding the perfect hostel accommodation 
          and connecting with compatible roommates around the world.
        </p>
        <div className="about-content">
          <section>
            <h2>Our Mission</h2>
            <p>
              We aim to make finding affordable, safe, and comfortable hostel accommodations 
              easier than ever before.
            </p>
          </section>
          <section>
            <h2>Why Choose Us</h2>
            <ul>
              <li>Verified listings and reviews</li>
              <li>Smart roommate matching</li>
              <li>Secure booking process</li>
              <li>24/7 customer support</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

export default AboutPage


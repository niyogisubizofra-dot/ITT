const Logo = ({ size = 40 }) => {
  const scale = size / 300; 

  return (
    <div 
      style={{
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative'
      }}
    >
      <div 
        style={{
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #5b3a1e 0%, #3b2413 70%, #24160d 100%)',
          border: '12px solid #1f2937',
          boxShadow: '0 0 20px #00d9ff, 0 0 50px rgba(0,217,255,0.5), inset 0 0 20px rgba(0,217,255,0.3)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <div 
          style={{
            position: 'absolute',
            top: '-15px',
            right: '-15px',
            bottom: '-15px',
            left: '-15px',
            borderRadius: '50%',
            border: '4px solid #00d9ff',
            boxShadow: '0 0 15px #00d9ff'
          }}
        />
        <div 
          style={{
            fontSize: '180px',
            fontWeight: 900,
            color: '#1e293b',
            textShadow: '0 0 10px #00d9ff, 0 0 20px #00d9ff, 0 0 40px #00d9ff',
            WebkitTextStroke: '3px #00d9ff',
            fontFamily: 'Arial, sans-serif'
          }}
        >
          I
        </div>
      </div>
    </div>
  );
};

export default Logo;

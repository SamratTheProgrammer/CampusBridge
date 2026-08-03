import React from 'react'

const TrustedBy = () => {
  const companies = [
    { name: 'Google', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg' },
    { name: 'Microsoft', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg' },
    { name: 'Amazon', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg' },
    { name: 'Adobe', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Adobe_Corporate_Logo.png' },
    { name: 'IBM', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg' },
    { name: 'TCS', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg' },
    { name: 'Infosys', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg' },
  ]

  return (
    <section className="py-12 border-y bg-muted/30">
      <div className="container max-w-7xl mx-auto px-3 sm:px-8 lg:px-12 text-center">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">
          Trusted by alumni working at top companies
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
          {companies.map((company) => (
            <div key={company.name} className="flex items-center justify-center">
              <img 
                src={company.logo} 
                alt={`${company.name} logo`} 
                className="h-6 md:h-8 object-contain"
                title={company.name}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TrustedBy

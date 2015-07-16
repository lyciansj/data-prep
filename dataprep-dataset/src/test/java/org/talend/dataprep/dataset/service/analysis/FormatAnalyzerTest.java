package org.talend.dataprep.dataset.service.analysis;

import static org.hamcrest.CoreMatchers.*;
import static org.junit.Assert.assertThat;
import static org.talend.dataprep.api.dataset.DataSetMetadata.Builder.metadata;

import org.junit.After;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.IntegrationTest;
import org.springframework.boot.test.SpringApplicationConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.web.WebAppConfiguration;
import org.talend.dataprep.api.dataset.DataSetMetadata;
import org.talend.dataprep.dataset.Application;
import org.talend.dataprep.dataset.service.DataSetServiceTests;
import org.talend.dataprep.dataset.store.content.DataSetContentStore;
import org.talend.dataprep.dataset.store.metadata.DataSetMetadataRepository;
import org.talend.dataprep.schema.CSVFormatGuess;
import org.talend.dataprep.schema.XlsFormatGuess;

@RunWith(SpringJUnit4ClassRunner.class)
@SpringApplicationConfiguration(classes = Application.class)
@WebAppConfiguration
@IntegrationTest
public class FormatAnalyzerTest {

    @Autowired
    FormatAnalysis formatAnalysis;

    @Autowired
    @Qualifier("ContentStore#local")
    DataSetContentStore contentStore;

    @Autowired
    DataSetMetadataRepository repository;

    @After
    public void tearDown() throws Exception {
        repository.clear();
        contentStore.clear();
    }

    @Test
    public void testNoDataSetFound() throws Exception {
        formatAnalysis.analyze("1234");
        assertThat(repository.get("1234"), nullValue());
    }

    @Test
    public void testCSVAnalysis() throws Exception {
        final DataSetMetadata metadata = metadata().id("1234").build();
        repository.add(metadata);
        contentStore.storeAsRaw(metadata, DataSetServiceTests.class.getResourceAsStream("../avengers.csv"));
        formatAnalysis.analyze("1234");
        assertThat(repository.get("1234"), notNullValue());
        assertThat(metadata.getContent().getFormatGuessId(), is(CSVFormatGuess.BEAN_ID));
        assertThat(metadata.getContent().getMediaType(), is("text/csv"));
        assertThat(metadata.getContent().getParameters().get("SEPARATOR"), is(";"));
    }

    @Test
    public void testXLSAnalysis() throws Exception {
        final DataSetMetadata metadata = metadata().id("1234").build();
        repository.add(metadata);
        contentStore.storeAsRaw(metadata, DataSetServiceTests.class.getResourceAsStream("../tagada.xls"));
        formatAnalysis.analyze("1234");
        assertThat(repository.get("1234"), notNullValue());
        assertThat(metadata.getContent().getFormatGuessId(), is(XlsFormatGuess.BEAN_ID));
        assertThat(metadata.getContent().getMediaType(), is("application/vnd.ms-excel"));
        assertThat(metadata.getContent().getParameters().isEmpty(), is(true));
    }

}
